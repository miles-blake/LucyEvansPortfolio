import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/auth";
import Link from "next/link";
import { PayButton } from "@/components/PayButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ verified?: string; as?: string }>;
}

const statusLabel: Record<string, string> = {
  INQUIRY: "Inquiry received",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusColor: Record<string, string> = {
  INQUIRY: "text-sky",
  CONFIRMED: "text-sage",
  COMPLETED: "text-muted-foreground",
  CANCELLED: "text-rose-500",
};

export default async function AccountPage({ searchParams }: Props) {
  const session = await auth();
  const { verified, as: previewAs } = await searchParams;

  const isAdmin = session?.user?.role === "admin";

  // Admin preview mode: show a picker if no email is specified yet
  if (isAdmin && !previewAs) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="mb-8 p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-800 font-meta">
          Admin preview mode — you&apos;re seeing this as yourself. Enter a client email to preview their account.
        </div>
        <h1 className="font-display text-2xl text-ink mb-6">Preview client account</h1>
        <form method="GET" className="flex gap-2">
          <input
            name="as"
            type="email"
            required
            placeholder="client@example.com"
            className="flex-1 border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky/40"
          />
          <button
            type="submit"
            className="text-xs bg-ink text-cream px-3 py-2 rounded-sm hover:opacity-80 transition-opacity font-meta whitespace-nowrap"
          >
            Preview →
          </button>
        </form>
        <p className="font-meta text-xs text-muted-foreground mt-3">
          This shows exactly what the client sees. Your admin session stays active.
        </p>
      </div>
    );
  }

  const email = isAdmin ? previewAs! : session!.user.email!;

  // Check verification status
  const client = await prisma.client.findUnique({
    where: { email },
    select: { emailVerified: true },
  });
  const isVerified = client?.emailVerified ?? true; // true fallback = don't show banner for non-Client accounts

  const bookings = await prisma.booking.findMany({
    where: { customerEmail: email },
    include: { package: true, portalToken: true },
    orderBy: { createdAt: "desc" },
  });

  const invoices = await prisma.invoice.findMany({
    where: { customerEmail: email },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Admin preview banner */}
      {isAdmin && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-800 font-meta flex items-center justify-between">
          <span>Admin preview — viewing as {email}</span>
          <a href="/account" className="underline">Change email →</a>
        </div>
      )}

      {/* Email verification banners */}
      {verified === "1" && (
        <div className="mb-6 p-4 bg-sage/10 border border-sage/30 rounded-sm text-sm text-sage">
          Your email address has been verified. Welcome!
        </div>
      )}
      {!isVerified && verified !== "1" && (
        <div className="mb-6 p-4 bg-sky/10 border border-sky/30 rounded-sm text-sm text-ink">
          <strong>Please verify your email address.</strong> Check your inbox for a verification link from Lucy Evans Photography. Your booking and invoice details will appear once you&rsquo;ve verified.
        </div>
      )}

      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl text-ink">My Account</h1>
          <p className="font-meta text-xs text-muted-foreground mt-1">{email}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="font-meta text-xs text-muted-foreground hover:text-ink transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* Bookings */}
      <section className="mb-10">
        <h2 className="font-display text-xl text-ink mb-4">Bookings</h2>
        {!isVerified ? (
          <p className="font-meta text-sm text-muted-foreground">Verify your email address to see your bookings.</p>
        ) : bookings.length === 0 ? (
          <p className="font-meta text-sm text-muted-foreground">No bookings on file yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="border border-border rounded-sm p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {b.package.name} — {b.eventType}
                  </p>
                  <p className="font-meta text-xs text-muted-foreground mt-0.5">
                    {new Date(b.eventDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className={`font-meta text-xs mt-1 ${statusColor[b.status] ?? "text-muted-foreground"}`}>
                    {statusLabel[b.status] ?? b.status}
                  </p>
                  {!b.depositPaid && b.status !== "CANCELLED" && !isAdmin && (
                    <div className="mt-3">
                      <PayButton
                        type="deposit"
                        bookingId={b.id}
                        label={`Pay deposit — $${(b.depositAmount / 100).toFixed(2)}`}
                      />
                    </div>
                  )}
                </div>
                {b.portalToken && new Date(b.portalToken.expiresAt) > new Date() ? (
                  <Link
                    href={`/portal/${b.portalToken.token}`}
                    className="font-meta text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity whitespace-nowrap"
                  >
                    View portal →
                  </Link>
                ) : (
                  <span className="font-meta text-xs text-muted-foreground whitespace-nowrap">
                    Portal coming soon
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invoices */}
      {isVerified && invoices.length > 0 && (
        <section>
          <h2 className="font-display text-xl text-ink mb-4">Invoices</h2>
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="border border-border rounded-sm p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{inv.number}</p>
                  <p className="font-meta text-xs text-muted-foreground mt-0.5">
                    ${(inv.amountDue / 100).toFixed(2)} due
                    {inv.dueDate
                      ? ` · ${new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : ""}
                  </p>
                  {inv.amountDue > 0 && inv.status !== "PAID" && !isAdmin && (
                    <div className="mt-3">
                      <PayButton
                        type="invoice"
                        invoiceId={inv.id}
                        label={`Pay now — $${(inv.amountDue / 100).toFixed(2)}`}
                      />
                    </div>
                  )}
                </div>
                <span
                  className={`font-meta text-xs ${
                    inv.status === "PAID"
                      ? "text-sage"
                      : inv.status === "SENT"
                      ? "text-sky"
                      : "text-muted-foreground"
                  }`}
                >
                  {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {bookings.length === 0 && invoices.length === 0 && (
        <div className="mt-4 border border-border rounded-sm p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing here yet. Once you book a session your details will appear here.
          </p>
          <Link
            href="/services"
            className="inline-block mt-4 font-meta text-xs bg-ink text-cream px-4 py-2 rounded-sm hover:opacity-80 transition-opacity"
          >
            Browse services →
          </Link>
        </div>
      )}
    </div>
  );
}
