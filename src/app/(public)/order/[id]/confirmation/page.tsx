import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { signDownloadToken } from "@/lib/download-token";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClearCartOnSuccess from "@/components/cart/ClearCartOnSuccess";
import DownloadButton from "@/components/DownloadButton";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { session_id } = await searchParams;

  let order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { photo: true, bundle: true } } },
  });

  if (!order) notFound();

  // If order is still PENDING and we have a Stripe session_id, verify payment directly.
  // This handles the race between Stripe's redirect and the webhook delivery.
  if (order.status === "PENDING" && session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid" && session.metadata?.orderId === id) {
        // Generate download URLs now (webhook will also do this, but we want them immediately)
        const downloadLinks = order.items.map((item) => ({
          id: item.id,
          token: signDownloadToken(item.id),
        }));

        order = await prisma.order.update({
          where: { id },
          data: {
            status: "PAID",
            customerEmail: session.customer_details?.email ?? order.customerEmail,
            stripePaymentIntentId: session.payment_intent as string ?? undefined,
            items: {
              update: downloadLinks.map(({ id: itemId, token }) => ({
                where: { id: itemId },
                data: {
                  signedDownloadUrl: `${process.env.NEXTAUTH_URL}/api/download/${itemId}?token=${token}`,
                },
              })),
            },
          },
          include: { items: { include: { photo: true, bundle: true } } },
        });
      }
    } catch {
      // Stripe lookup failed — fall through and check DB status
    }
  }

  if (order.status !== "PAID") notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <ClearCartOnSuccess />

      <div className="text-center mb-12">
        <CheckCircle size={48} className="text-sky mx-auto mb-6" />
        <h1 className="font-display text-3xl md:text-4xl text-ink mb-3">Order confirmed.</h1>
        <p className="text-muted-foreground mb-1">
          {order.customerEmail
            ? <>A confirmation email with your download links has been sent to <strong>{order.customerEmail}</strong>.</>
            : "Your download links are ready below."}
        </p>
        <p className="font-meta text-sm text-muted-foreground">
          Download anytime — your links never expire.
        </p>
      </div>

      {/* Download links */}
      <div className="space-y-3 mb-12">
        <p className="font-meta text-xs text-muted-foreground uppercase tracking-widest mb-4">Your downloads</p>
        {order.items.map((item) => {
          const name = item.photo?.title ?? item.bundle?.title ?? "Download";
          const filename = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".jpg";
          return (
            <div
              key={item.id}
              className="flex items-center justify-between border border-border rounded-sm p-4 gap-4"
            >
              <div className="min-w-0">
                <p className="font-display text-ink truncate">{name}</p>
                <p className="font-meta text-muted-foreground text-xs mt-0.5">Digital print · personal use license</p>
              </div>
              {item.signedDownloadUrl ? (
                <DownloadButton href={item.signedDownloadUrl} filename={filename} />
              ) : (
                <span className="font-meta text-muted-foreground text-sm shrink-0">Preparing…</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="font-meta text-xs text-muted-foreground text-center mb-8">
        Personal use only — not for resale or commercial use.{" "}
        <Link href="/license" className="underline underline-offset-2 hover:text-ink transition-colors">
          Full license terms
        </Link>
      </p>

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
