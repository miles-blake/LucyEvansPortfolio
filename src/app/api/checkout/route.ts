import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getBundleDiscountPct } from "@/lib/bundle-discount";

const itemSchema = z.object({
  id: z.string(),
  type: z.enum(["photo", "bundle"]),
  title: z.string(),
  price: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const schema = z.object({
  items: z.array(itemSchema).min(1),
  discountCode: z.string().optional(),
  bundlePct: z.number().int().min(0).max(20).optional(),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, discountCode, bundlePct: clientBundlePct, customerName, customerEmail, customerPhone } = schema.parse(body);

    // Verify prices server-side — never trust client-sent prices
    const verifiedLineItems = await Promise.all(
      items.map(async (item) => {
        if (item.type === "photo") {
          const photo = await prisma.photo.findUnique({ where: { id: item.id } });
          if (!photo) throw new Error(`Photo not found: ${item.id}`);
          return { name: photo.title, price: photo.price, id: item.id, type: "photo" as const };
        } else {
          const bundle = await prisma.bundle.findUnique({ where: { id: item.id } });
          if (!bundle) throw new Error(`Bundle not found: ${item.id}`);
          return { name: bundle.title, price: bundle.price, id: item.id, type: "bundle" as const };
        }
      })
    );

    // Validate discount code
    let discount: { id: string; type: string; amount: number } | null = null;
    if (discountCode) {
      const code = await prisma.discountCode.findUnique({
        where: { code: discountCode.trim().toUpperCase() },
      });
      if (!code || !code.active) {
        return NextResponse.json({ error: "Invalid or inactive discount code." }, { status: 400 });
      }
      if (code.expiresAt && code.expiresAt < new Date()) {
        return NextResponse.json({ error: "This discount code has expired." }, { status: 400 });
      }
      if (code.usageLimit !== null && code.usageCount >= code.usageLimit) {
        return NextResponse.json({ error: "This discount code has reached its usage limit." }, { status: 400 });
      }
      discount = code;
    }

    // Server-side bundle discount (re-computed — never trust the client value blindly)
    const photoCount = verifiedLineItems.filter((i) => i.type === "photo").length;
    const serverBundlePct = getBundleDiscountPct(photoCount);
    // If client sent a bundlePct, it must match server's calculation
    if (clientBundlePct !== undefined && clientBundlePct !== serverBundlePct) {
      return NextResponse.json({ error: "Invalid bundle discount." }, { status: 400 });
    }
    const photoSubtotal = verifiedLineItems.filter((i) => i.type === "photo").reduce((s, i) => s + i.price, 0);
    const bundleSavings = Math.round((photoSubtotal * serverBundlePct) / 100);

    const subtotal = verifiedLineItems.reduce((s, i) => s + i.price, 0);
    let discountAmount = bundleSavings;
    if (discount) {
      const afterBundle = subtotal - bundleSavings;
      if (discount.type === "percent") {
        discountAmount += Math.round((afterBundle * discount.amount) / 100);
      } else {
        discountAmount += Math.min(discount.amount, afterBundle);
      }
    }
    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

    // Create a pending Order record before redirecting to Stripe
    const order = await prisma.order.create({
      data: {
        customerEmail,
        customerName,
        customerPhone: customerPhone || null,
        totalAmount: totalAfterDiscount,
        status: "PENDING",
        items: {
          create: verifiedLineItems.map((i) => ({
            ...(i.type === "photo" ? { photoId: i.id } : { bundleId: i.id }),
            price: i.price,
          })),
        },
      },
    });

    const lineItemsForStripe = verifiedLineItems.map((item) => ({
      price_data: {
        currency: "usd",
        unit_amount: item.price,
        product_data: {
          name: item.name,
          description: "Digital download — personal use license",
        },
      },
      quantity: 1,
    }));

    // Stripe doesn't accept negative unit_amount — use a coupon for discounts
    const stripeCoupons: { coupon: string }[] = [];
    if (discountAmount > 0) {
      const couponName = bundleSavings > 0 && discount
        ? `Bundle ${serverBundlePct}% + discount code`
        : bundleSavings > 0
        ? `Bundle discount (${serverBundlePct}% off ${photoCount} photos)`
        : discount?.type === "percent"
        ? `Discount code (${discount.amount}% off)`
        : `Discount code (${discountCode})`;
      const coupon = await stripe.coupons.create({
        amount_off: discountAmount,
        currency: "usd",
        duration: "once",
        name: couponName,
      });
      stripeCoupons.push({ coupon: coupon.id });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItemsForStripe,
      ...(stripeCoupons.length > 0 ? { discounts: stripeCoupons } : {}),
      metadata: { orderId: order.id },
      customer_email: customerEmail,
      phone_number_collection: { enabled: true },
      success_url: `${process.env.NEXTAUTH_URL}/order/${order.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
      customer_creation: "always",
    });

    // Store the Stripe session ID on the order for webhook reconciliation
    const ops: Promise<unknown>[] = [
      prisma.order.update({
        where: { id: order.id },
        data: { stripePaymentIntentId: session.payment_intent as string | null },
      }),
    ];
    if (discount) {
      ops.push(prisma.discountCode.update({
        where: { id: discount.id },
        data: { usageCount: { increment: 1 } },
      }));
    }
    await Promise.all(ops);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    console.error("[checkout] error:", err);
    return NextResponse.json({ error: "Checkout failed." }, { status: 500 });
  }
}
