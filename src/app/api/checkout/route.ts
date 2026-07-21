import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

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
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, discountCode } = schema.parse(body);

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

    const subtotal = verifiedLineItems.reduce((s, i) => s + i.price, 0);
    let discountAmount = 0;
    if (discount) {
      if (discount.type === "percent") {
        discountAmount = Math.round((subtotal * discount.amount) / 100);
      } else {
        discountAmount = Math.min(discount.amount, subtotal);
      }
    }
    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

    // Create a pending Order record before redirecting to Stripe
    const order = await prisma.order.create({
      data: {
        customerEmail: "", // filled in by webhook after payment
        totalAmount: totalAfterDiscount,
        status: "PENDING",
        items: {
          create: verifiedLineItems.map((i) => ({
            ...(i.type === "photo" ? { photoId: i.id } : { bundleId: i.id }),
            price: i.price,
            downloadLimit: 5,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
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

    // Add a negative line item for the discount
    if (discount && discountAmount > 0) {
      const label = discount.type === "percent"
        ? `Discount (${discount.amount}% off)`
        : `Discount (${discountCode})`;
      lineItemsForStripe.push({
        price_data: {
          currency: "usd",
          unit_amount: -discountAmount,
          product_data: { name: label, description: "" },
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItemsForStripe,
      metadata: { orderId: order.id },
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
