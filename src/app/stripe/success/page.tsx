import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { ClearPortalCookie } from "./ClearPortalCookie";

export const metadata: Metadata = { title: "Payment confirmed — Lucy Evans Photography" };

const PORTAL_TOKEN_COOKIE = "lep_portal_token";

interface Props {
  searchParams: Promise<{
    type?: string;
    bookingId?: string;
    invoiceId?: string;
    session_id?: string;
  }>;
}

export default async function StripeSuccessPage({ searchParams }: Props) {
  const { type, bookingId, invoiceId } = await searchParams;

  // Read portal token from HttpOnly cookie (not URL) to keep it out of logs
  const cookieStore = await cookies();
  const portalToken = cookieStore.get(PORTAL_TOKEN_COOKIE)?.value ?? null;

  const backHref = portalToken
    ? `/portal/${portalToken}`
    : "/account";

  const backLabel = portalToken ? "Back to your booking portal" : "Back to my account";

  const detail =
    type === "deposit"
      ? `Your deposit has been received and your date is now held.`
      : type === "invoice"
      ? `Your invoice payment has been received.`
      : `Your payment has been received.`;

  // Suppress unused-variable warnings for bookingId / invoiceId — kept in scope
  void bookingId;
  void invoiceId;

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <ClearPortalCookie />
      <div className="max-w-md w-full text-center space-y-6">
        <div className="border border-border rounded-sm p-10 space-y-4">
          <h1 className="font-display text-3xl text-ink">Payment received — thank you!</h1>
          <p className="text-sm text-muted-foreground">{detail}</p>
          <Link
            href={backHref}
            className="inline-block mt-4 font-meta text-xs bg-ink text-cream px-4 py-2 rounded-sm hover:opacity-80 transition-opacity"
          >
            {backLabel} →
          </Link>
        </div>
        <p className="font-meta text-xs text-muted-foreground">
          Questions? Email{" "}
          <a href="mailto:hello@lucyevans.com" className="text-sky hover:opacity-70">
            hello@lucyevans.com
          </a>
        </p>
      </div>
    </div>
  );
}
