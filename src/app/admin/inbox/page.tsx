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
  await prisma.bookingMessage.updateMany({
    where: { senderRole: "client", readByAdmin: false },
    data: { readByAdmin: true },
  });
  revalidatePath("/admin/inbox");
}

export default async function AdminInboxPage() {
  const messages = await prisma.bookingMessage.findMany({
    where: { senderRole: "client", readByAdmin: false },
    orderBy: { createdAt: "desc" },
    include: {
      booking: { select: { id: true, customerName: true, customerEmail: true } },
    },
  });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink">Inbox</h1>
          {messages.length > 0 && (
            <p className="font-meta text-sm text-muted-foreground mt-1">
              {messages.length} unread {messages.length === 1 ? "message" : "messages"}
            </p>
          )}
        </div>
        {messages.length > 0 && (
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

      {messages.length === 0 ? (
        <div className="border border-border rounded-sm p-12 text-center">
          <p className="text-muted-foreground text-sm">No unread messages.</p>
          <p className="font-meta text-xs text-muted-foreground mt-1">You&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <Link
              key={msg.id}
              href={`/admin/bookings/${msg.booking.id}`}
              className="block border border-border rounded-sm px-4 py-4 hover:bg-ink/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0">
                  <p className="text-sm text-ink font-medium truncate">{msg.booking.customerName}</p>
                  <p className="font-meta text-xs text-muted-foreground truncate">{msg.booking.customerEmail}</p>
                </div>
                <time className="font-meta text-xs text-muted-foreground shrink-0">{timeAgo(msg.createdAt)}</time>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {msg.body.slice(0, 120)}{msg.body.length > 120 ? "…" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
