import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns confirmed/inquiry booking dates so the form can block them
export async function GET() {
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["INQUIRY", "CONFIRMED"] },
      eventDate: { gte: new Date() },
    },
    select: { eventDate: true },
  });

  const dates = bookings.map((b) => b.eventDate.toISOString().split("T")[0]);
  return NextResponse.json({ dates });
}
