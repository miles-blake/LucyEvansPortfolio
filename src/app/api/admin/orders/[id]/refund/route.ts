import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-06-24.dahlia" });

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, stripePaymentIntentId: true, totalAmount: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "PAID") {
    return NextResponse.json({ error: "Only paid orders can be refunded." }, { status: 400 });
  }

  if (!order.stripePaymentIntentId) {
    return NextResponse.json({ error: "No Stripe payment found for this order." }, { status: 400 });
  }

  try {
    await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe refund failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  await prisma.order.update({
    where: { id },
    data: { status: "REFUNDED" },
  });

  return NextResponse.json({ ok: true });
}
