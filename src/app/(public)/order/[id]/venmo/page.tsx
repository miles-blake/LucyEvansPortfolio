import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VenmoPaymentFlow } from "@/components/VenmoPaymentFlow";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pay with Venmo" };
export const dynamic = "force-dynamic";

export default async function OrderVenmoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { photo: true, bundle: true } } },
  });

  if (!order) notFound();

  // Already paid — redirect to confirmation
  if (order.status === "PAID") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="font-display text-2xl text-ink mb-3">Already paid!</p>
        <p className="text-muted-foreground">
          This order has been paid. Check your email for your download links.
        </p>
      </div>
    );
  }

  const hasPendingVenmo = await prisma.venmoPayment.findFirst({
    where: { orderId: id, status: "pending" },
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <p className="font-meta text-xs text-muted-foreground uppercase tracking-widest mb-3">Venmo checkout</p>
      <h1 className="font-display text-3xl text-ink mb-8">Pay with Venmo</h1>

      {/* Order summary */}
      <div className="border border-border rounded-sm p-5 mb-6 space-y-2 text-sm">
        <p className="font-display text-ink mb-3">Order summary</p>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-muted-foreground">
            <span>{item.photo?.title ?? item.bundle?.title ?? "Item"}</span>
            <span className="font-meta">${(item.price / 100).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 border-t border-border font-medium text-ink">
          <span>Total</span>
          <span className="font-meta">${(order.totalAmount / 100).toFixed(2)}</span>
        </div>
      </div>

      {hasPendingVenmo ? (
        <div className="p-4 bg-sage/10 border border-sage/30 rounded-sm text-sm text-ink">
          <p className="font-medium mb-1">Payment submitted — thank you!</p>
          <p className="text-muted-foreground">
            Lucy will verify your payment and send your download links within 24 hours.
          </p>
        </div>
      ) : (
        <VenmoPaymentFlow
          orderId={id}
          amount={order.totalAmount}
          customerName={order.customerName}
          type="order"
        />
      )}
    </div>
  );
}
