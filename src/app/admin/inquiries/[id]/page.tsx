import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { markRead, replyToInquiry, saveAdminNotes, deleteInquiry } from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) notFound();

  // Mark as READ on first view
  if (inquiry.status === "NEW") {
    await markRead(id);
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/inquiries"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink mb-6"
      >
        ← Back to inquiries
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink mb-1">{inquiry.subject}</h1>
        <p className="font-meta text-xs text-muted-foreground">
          {formatDate(inquiry.createdAt)}
        </p>
      </div>

      {/* Metadata */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border border-border rounded-sm p-4 mb-6 text-sm">
        <dt className="text-muted-foreground">From</dt>
        <dd className="text-ink">{inquiry.name}</dd>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="text-ink">
          <a href={`mailto:${inquiry.email}`} className="hover:underline">
            {inquiry.email}
          </a>
        </dd>
        {inquiry.phone && (
          <>
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="text-ink">{inquiry.phone}</dd>
          </>
        )}
        {inquiry.packageInterest && (
          <>
            <dt className="text-muted-foreground">Package interest</dt>
            <dd className="text-ink">{inquiry.packageInterest}</dd>
          </>
        )}
        {inquiry.reason && (
          <>
            <dt className="text-muted-foreground">Reason</dt>
            <dd className="text-ink">{inquiry.reason}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Prefers</dt>
        <dd className="text-ink capitalize">{inquiry.commPref}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>
          {inquiry.status === "NEW" && (
            <span className="font-meta text-xs bg-rose/10 text-rose px-2 py-0.5 rounded-sm">New</span>
          )}
          {inquiry.status === "READ" && (
            <span className="font-meta text-xs bg-ink/10 text-muted-foreground px-2 py-0.5 rounded-sm">Read</span>
          )}
          {inquiry.status === "REPLIED" && (
            <span className="font-meta text-xs bg-sage/20 text-sage px-2 py-0.5 rounded-sm">Replied</span>
          )}
        </dd>
        {inquiry.repliedAt && (
          <>
            <dt className="text-muted-foreground">Replied at</dt>
            <dd className="text-muted-foreground font-meta text-xs">{formatDate(inquiry.repliedAt)}</dd>
          </>
        )}
      </dl>

      {/* Message */}
      <div className="border border-border rounded-sm p-5 mb-8">
        <p className="font-meta text-xs text-muted-foreground uppercase tracking-wide mb-3">Message</p>
        <p className="text-ink leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
      </div>

      {/* Reply form */}
      <section className="mb-8">
        <h2 className="font-display text-lg text-ink mb-4">Send a reply</h2>
        <form action={replyToInquiry} className="space-y-4">
          <input type="hidden" name="id" value={inquiry.id} />
          <div>
            <label htmlFor="replyMessage" className="block font-meta text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
              Reply to {inquiry.name} ({inquiry.email})
            </label>
            <textarea
              id="replyMessage"
              name="replyMessage"
              rows={6}
              required
              className={inputClass}
              placeholder="Write your reply…"
            />
          </div>
          <button
            type="submit"
            className="bg-ink text-cream text-sm px-5 py-2.5 rounded-sm hover:opacity-80 transition-opacity"
          >
            Send reply
          </button>
        </form>
      </section>

      {/* Admin notes */}
      <section className="mb-8">
        <h2 className="font-display text-lg text-ink mb-4">Admin notes</h2>
        <form action={saveAdminNotes} className="space-y-4">
          <input type="hidden" name="id" value={inquiry.id} />
          <textarea
            name="adminNotes"
            rows={4}
            defaultValue={inquiry.adminNotes ?? ""}
            className={inputClass}
            placeholder="Private notes (not sent to the inquirer)…"
          />
          <button
            type="submit"
            className="bg-ink text-cream text-sm px-5 py-2.5 rounded-sm hover:opacity-80 transition-opacity"
          >
            Save notes
          </button>
        </form>
      </section>

      {/* Delete */}
      <section className="border-t border-border pt-6">
        <form action={deleteInquiry}>
          <input type="hidden" name="id" value={inquiry.id} />
          <button
            type="submit"
            className="text-sm text-rose hover:opacity-70 transition-opacity"
          >
            Delete inquiry
          </button>
        </form>
      </section>
    </div>
  );
}
