import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { OrderEditForm } from "@/components/admin/OrderEditForm";
import { RefundOrderButton } from "@/components/admin/RefundOrderButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, select: { customerEmail: true } });
  if (!order) return {};
  return { title: `Order — ${order.customerEmail}` };
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  const [order, photos, bundles] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            photo: { select: { title: true, price: true, previewImageUrl: true } },
            bundle: { select: { title: true, price: true } },
          },
        },
      },
    }),
    prisma.photo.findMany({ select: { id: true, title: true, price: true }, orderBy: { title: "asc" } }),
    prisma.bundle.findMany({ select: { id: true, title: true, price: true }, orderBy: { title: "asc" } }),
  ]);

  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 font-meta text-muted-foreground hover:text-ink transition-colors text-sm mb-6"
      >
        <ArrowLeft size={14} /> All orders
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink">{order.customerEmail}</h1>
        <p className="font-meta text-sm text-muted-foreground mt-1">
          Order placed {formatDate(order.createdAt)}
        </p>
      </div>

      <OrderEditForm order={order} photos={photos} bundles={bundles} />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/email?to=${encodeURIComponent(order.customerEmail)}&subject=${encodeURIComponent("Re: your order")}`}
          className="border border-border text-muted-foreground px-3 py-1.5 rounded-sm text-xs font-meta hover:text-ink transition-colors inline-flex"
        >
          Email customer →
        </Link>

        {order.status === "PAID" && order.stripePaymentIntentId && (
          <RefundOrderButton orderId={order.id} amount={order.totalAmount} />
        )}
      </div>
    </div>
  );
}
