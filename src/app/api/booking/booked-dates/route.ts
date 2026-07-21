import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [bookings, blackouts] = await Promise.all([
    prisma.booking.findMany({
      where: { status: { in: ["INQUIRY", "CONFIRMED"] }, eventDate: { gte: new Date() } },
      select: { eventDate: true },
    }),
    prisma.blackoutDate.findMany({
      where: { date: { gte: new Date() } },
      select: { date: true },
    }),
  ]);

  const dates = [
    ...bookings.map((b) => b.eventDate.toISOString().split("T")[0]),
    ...blackouts.map((b) => b.date.toISOString().split("T")[0]),
  ];
  return NextResponse.json({ dates: [...new Set(dates)] });
}
