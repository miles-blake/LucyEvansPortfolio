import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { togglePublishMiniSession, deleteMiniSessionDay, deleteSlot, addSlot } from "../actions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const day = await prisma.miniSessionDay.findUnique({ where: { id }, select: { title: true } });
  if (!day) return {};
  return { title: `Admin — ${day.title}` };
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

const STATUS_STYLE: Record<string, string> = {
  available: "bg-sage/20 text-sage",
  held: "bg-sky/20 text-sky",
  booked: "bg-blush/20 text-rose",
};

export default async function MiniSessionDayPage({ params }: Props) {
  const { id } = await params;
  const day = await prisma.miniSessionDay.findUnique({
    where: { id },
    include: { slots: { orderBy: { startTime: "asc" } } },
  });
  if (!day) notFound();

  const booked = day.slots.filter((s) => s.status === "booked").length;
  const revenue = booked * day.price;

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/mini-sessions"
        className="inline-flex items-center gap-2 font-meta text-muted-foreground hover:text-ink transition-colors text-sm mb-6"
      >
        <ArrowLeft size={14} /> All mini sessions
      </Link>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">{day.title}</h1>
          <p className="font-meta text-sm text-muted-foreground mt-1">
            {formatDate(day.date)} · {formatPrice(day.price)}/slot · {day.duration} min
            {day.location && ` · ${day.location}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${day.isPublished ? "bg-sage/20 text-sage" : "bg-ink/10 text-muted-foreground"}`}>
            {day.isPublished ? "published" : "draft"}
          </span>
          <form action={togglePublishMiniSession}>
            <input type="hidden" name="id" value={day.id} />
            <input type="hidden" name="isPublished" value={String(day.isPublished)} />
            <button className="text-xs border border-border text-muted-foreground px-3 py-1.5 rounded-sm hover:text-ink transition-colors font-meta">
              {day.isPublished ? "Unpublish" : "Publish"}
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-border rounded-sm p-4">
          <p className="font-meta text-xs text-muted-foreground">Total slots</p>
          <p className="font-display text-2xl text-ink mt-1">{day.slots.length}</p>
        </div>
        <div className="border border-border rounded-sm p-4">
          <p className="font-meta text-xs text-muted-foreground">Booked</p>
          <p className="font-display text-2xl text-ink mt-1">{booked}</p>
        </div>
        <div className="border border-border rounded-sm p-4">
          <p className="font-meta text-xs text-muted-foreground">Revenue</p>
          <p className="font-display text-2xl text-ink mt-1">{formatPrice(revenue)}</p>
        </div>
      </div>

      {/* Public link */}
      {day.isPublished && (
        <div className="mb-6 p-4 bg-sage/10 border border-sage/30 rounded-sm">
          <p className="font-meta text-xs text-muted-foreground mb-1">Public booking page:</p>
          <Link
            href={`/mini-sessions/${day.id}`}
            target="_blank"
            className="text-sm text-ink hover:opacity-70 transition-opacity underline underline-offset-2"
          >
            /mini-sessions/{day.id} ↗
          </Link>
        </div>
      )}

      {/* Slots */}
      <section className="border border-border rounded-sm p-6 mb-6">
        <h2 className="font-display text-lg text-ink mb-4">Time slots</h2>

        {day.slots.length === 0 ? (
          <p className="font-meta text-sm text-muted-foreground">No slots yet.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {day.slots.map((slot) => (
              <li key={slot.id} className="border border-border rounded-sm p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-meta text-sm text-ink">{formatTime(slot.startTime)}</span>
                    <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${STATUS_STYLE[slot.status] ?? "bg-ink/10 text-ink"}`}>
                      {slot.status}
                    </span>
                  </div>
                  {slot.status === "available" && (
                    <form action={deleteSlot}>
                      <input type="hidden" name="id" value={slot.id} />
                      <input type="hidden" name="dayId" value={day.id} />
                      <button className="font-meta text-xs text-muted-foreground hover:text-rose transition-colors">
                        Remove
                      </button>
                    </form>
                  )}
                </div>
                {slot.clientName && (
                  <div className="mt-2 pt-2 border-t border-border/60">
                    <p className="text-sm text-ink">{slot.clientName}</p>
                    <p className="font-meta text-xs text-muted-foreground">
                      {slot.clientEmail}
                      {slot.clientPhone && ` · ${slot.clientPhone}`}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <form action={addSlot} className="flex gap-2 pt-4 border-t border-border">
          <input type="hidden" name="dayId" value={day.id} />
          <input
            name="startTime"
            type="datetime-local"
            required
            className="flex-1 border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30"
          />
          <button
            type="submit"
            className="text-xs border border-border text-muted-foreground px-3 py-1.5 rounded-sm hover:text-ink transition-colors font-meta whitespace-nowrap"
          >
            + Add slot
          </button>
        </form>
      </section>

      {/* Description */}
      {day.description && (
        <section className="border border-border rounded-sm p-6 mb-6">
          <h2 className="font-display text-lg text-ink mb-3">Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{day.description}</p>
        </section>
      )}

      {/* Delete */}
      <section className="border border-rose/20 rounded-sm p-6">
        <h2 className="font-display text-lg text-ink mb-3">Delete</h2>
        <p className="font-meta text-xs text-muted-foreground mb-4">
          Deletes this day and all its slots. Booked clients will not be automatically notified — email them first if needed.
        </p>
        <form action={deleteMiniSessionDay} onSubmit={(e) => {
          if (!confirm("Delete this mini session day and all its slots?")) e.preventDefault();
        }}>
          <input type="hidden" name="id" value={day.id} />
          <button className="text-xs border border-rose/40 text-rose px-3 py-1.5 rounded-sm hover:bg-rose/5 transition-colors font-meta">
            Delete day
          </button>
        </form>
      </section>
    </div>
  );
}
