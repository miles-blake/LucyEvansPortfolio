import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MiniSessionBookingForm } from "./MiniSessionBookingForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const day = await prisma.miniSessionDay.findUnique({ where: { id }, select: { title: true } });
  if (!day) return {};
  return { title: `${day.title} — Lucy Evans Photography` };
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

export default async function MiniSessionDayPublicPage({ params }: Props) {
  const { id } = await params;
  const day = await prisma.miniSessionDay.findUnique({
    where: { id, isPublished: true },
    include: {
      slots: {
        where: { status: "available" },
        orderBy: { startTime: "asc" },
      },
    },
  });
  if (!day) notFound();

  const availableSlots = day.slots.map((s) => ({
    id: s.id,
    label: formatTime(s.startTime),
    startTime: s.startTime.toISOString(),
  }));

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-ink">{day.title}</h1>
        <p className="font-meta text-sm text-muted-foreground mt-2">
          {formatDate(day.date)}
          {day.location && ` · ${day.location}`}
          {" · "}{day.duration} min · {formatPrice(day.price)}
        </p>
        {day.description && (
          <p className="text-muted-foreground mt-4 leading-relaxed">{day.description}</p>
        )}
      </div>

      {availableSlots.length === 0 ? (
        <div className="border border-border rounded-sm p-8 text-center">
          <p className="font-display text-lg text-ink">All slots booked</p>
          <p className="font-meta text-sm text-muted-foreground mt-2">
            All time slots for this day have been taken. Check back later or{" "}
            <a href="/contact" className="text-ink underline underline-offset-2 hover:opacity-70">
              contact Lucy
            </a>{" "}
            to be added to a waitlist.
          </p>
        </div>
      ) : (
        <MiniSessionBookingForm
          dayId={day.id}
          dayTitle={day.title}
          slots={availableSlots}
          price={day.price}
          duration={day.duration}
        />
      )}
    </main>
  );
}
