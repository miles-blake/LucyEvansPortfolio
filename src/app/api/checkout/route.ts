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
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = schema.parse(body);

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

    // Create a pending Order record before redirecting to Stripe
    const order = await prisma.order.create({
      data: {
        customerEmail: "", // filled in by webhook after payment
        totalAmount: verifiedLineItems.reduce((s, i) => s + i.price, 0),
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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: verifiedLineItems.map((item) => ({
        price_data: {
          currency: "usd",
          unit_amount: item.price,
          product_data: {
            name: item.name,
            description: "Digital download — personal use license",
          },
        },
        quantity: 1,
      })),
      metadata: { orderId: order.id },
      success_url: `${process.env.NEXTAUTH_URL}/order/${order.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
      // Collect email at checkout so we can email the download link
      customer_creation: "always",
    });

    // Store the Stripe session ID on the order for webhook reconciliation
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: session.payment_intent as string | null },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    console.error("[checkout] error:", err);
    return NextResponse.json({ error: "Checkout failed." }, { status: 500 });
  }
}
