export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CheckCircle, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClearCartOnSuccess from "@/components/cart/ClearCartOnSuccess";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { photo: true, bundle: true } } },
  });

  if (!order || order.status !== "PAID") notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
      {/* Clear cart client-side once we confirm the order is paid */}
      <ClearCartOnSuccess />

      <CheckCircle size={48} className="text-sky mx-auto mb-6" />
      <h1 className="font-display text-4xl text-ink mb-3">Order confirmed.</h1>
      <p className="text-muted-foreground mb-2">
        A confirmation email with your download links has been sent to{" "}
        <strong>{order.customerEmail}</strong>.
      </p>
      <p className="font-meta text-muted-foreground mb-12">
        Links expire in 30 days · 5 downloads each
      </p>

      {/* Download links */}
      <div className="text-left space-y-4 mb-12">
        <p className="font-meta text-muted-foreground">Your downloads</p>
        {order.items.map((item) => {
          const name = item.photo?.title ?? item.bundle?.title ?? "Download";
          return (
            <div
              key={item.id}
              className="flex items-center justify-between border border-border rounded-sm p-4"
            >
              <div>
                <p className="font-display text-ink">{name}</p>
                <p className="font-meta text-muted-foreground text-sm">
                  {item.downloadCount} / {item.downloadLimit} downloads used
                </p>
              </div>
              {item.signedDownloadUrl ? (
                <a
                  href={item.signedDownloadUrl}
                  className="inline-flex items-center gap-2 bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-ink/80 transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Download size={14} /> Download
                </a>
              ) : (
                <span className="font-meta text-muted-foreground text-sm">Preparing…</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/gallery">
          <Button variant="outline" className="inline-flex items-center gap-2">
            Back to gallery <ArrowRight size={16} />
          </Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline">Questions? Contact us</Button>
        </Link>
      </div>
    </div>
  );
}
