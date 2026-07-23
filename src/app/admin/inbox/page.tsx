import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin — Inbox" };

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function markAllRead() {
  "use server";
  await Promise.all([
    prisma.bookingMessage.updateMany({
      where: { senderRole: "client", readByAdmin: false },
      data: { readByAdmin: true },
    }),
    prisma.inquiry.updateMany({
      where: { status: "NEW" },
      data: { status: "READ" },
    }),
  ]);
  revalidatePath("/admin/inbox");
}

type InboxItem =
  | { kind: "message"; id: string; senderName: string; senderEmail: string; preview: string; date: Date; href: string }
  | { kind: "inquiry"; id: string; senderName: string; senderEmail: string; preview: string; date: Date; href: string; subject: string };

export default async function AdminInboxPage() {
  const [messages, inquiries] = await Promise.all([
    prisma.bookingMessage.findMany({
      where: { senderRole: "client", readByAdmin: false },
      orderBy: { createdAt: "desc" },
      include: {
        booking: { select: { id: true, customerName: true, customerEmail: true } },
      },
    }),
    prisma.inquiry.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const items: InboxItem[] = [
    ...messages.map((m) => ({
      kind: "message" as const,
      id: m.id,
      senderName: m.booking.customerName,
      senderEmail: m.booking.customerEmail,
      preview: m.body,
      date: m.createdAt,
      href: `/admin/bookings/${m.booking.id}`,
    })),
    ...inquiries.map((inq) => ({
      kind: "inquiry" as const,
      id: inq.id,
      senderName: inq.name,
      senderEmail: inq.email,
      preview: inq.message,
      date: inq.createdAt,
      href: `/admin/inquiries/${inq.id}`,
      subject: inq.subject,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const total = items.length;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink">Inbox</h1>
          {total > 0 && (
            <p className="font-meta text-sm text-muted-foreground mt-1">
              {total} unread {total === 1 ? "message" : "messages"}
            </p>
          )}
        </div>
        {total > 0 && (
          <form action={markAllRead}>
            <button
              type="submit"
              className="text-xs border border-border text-muted-foreground px-3 py-1.5 rounded-sm hover:text-ink transition-colors font-meta"
            >
              Mark all read
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="border border-border rounded-sm p-12 text-center">
          <p className="text-muted-foreground text-sm">No unread messages.</p>
          <p className="font-meta text-xs text-muted-foreground mt-1">You&apos;re all caught up.</p>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground font-meta">
            <Link href="/admin/inquiries" className="hover:text-ink transition-colors">View all inquiries →</Link>
            <Link href="/admin/bookings" className="hover:text-ink transition-colors">View all bookings →</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={`${item.kind}-${item.id}`}
              href={item.href}
              className="block border border-border rounded-sm px-4 py-4 hover:bg-ink/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`font-meta text-[10px] px-1.5 py-0.5 rounded-sm shrink-0 ${
                    item.kind === "inquiry"
                      ? "bg-rose/10 text-rose"
                      : "bg-sky/10 text-sky"
                  }`}>
                    {item.kind === "inquiry" ? "inquiry" : "message"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-ink font-medium truncate">{item.senderName}</p>
                    <p className="font-meta text-xs text-muted-foreground truncate">{item.senderEmail}</p>
                  </div>
                </div>
                <time className="font-meta text-xs text-muted-foreground shrink-0">{timeAgo(item.date)}</time>
              </div>
              {item.kind === "inquiry" && (
                <p className="text-xs text-muted-foreground font-medium mb-1 truncate">{item.subject}</p>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {item.preview.slice(0, 140)}{item.preview.length > 140 ? "…" : ""}
              </p>
            </Link>
          ))}

          <div className="pt-4 flex items-center gap-6 text-xs text-muted-foreground font-meta">
            <Link href="/admin/inquiries" className="hover:text-ink transition-colors">View all inquiries →</Link>
            <Link href="/admin/bookings" className="hover:text-ink transition-colors">View all bookings →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
