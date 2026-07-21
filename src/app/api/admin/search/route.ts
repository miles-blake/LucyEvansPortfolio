import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [bookings, orders, photos, inquiries] = await Promise.all([
    prisma.booking.findMany({
      where: {
        OR: [
          { customerName: { contains: q, mode: "insensitive" } },
          { customerEmail: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, customerName: true, customerEmail: true, eventType: true, status: true },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { customerName: { contains: q, mode: "insensitive" } },
          { customerEmail: { contains: q, mode: "insensitive" } },
        ],
        status: "PAID",
      },
      select: { id: true, customerName: true, customerEmail: true, totalAmount: true },
      take: 5,
    }),
    prisma.photo.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { id: true, title: true, slug: true, price: true },
      take: 5,
    }),
    prisma.inquiry.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { subject: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, subject: true, status: true },
      take: 5,
    }),
  ]);

  const results = [
    ...bookings.map((b) => ({
      type: "booking" as const,
      id: b.id,
      label: b.customerName,
      sub: `${b.eventType} · ${b.status.toLowerCase()}`,
      href: `/admin/bookings/${b.id}`,
    })),
    ...orders.map((o) => ({
      type: "order" as const,
      id: o.id,
      label: o.customerName || o.customerEmail,
      sub: `Order · $${(o.totalAmount / 100).toFixed(2)}`,
      href: `/admin/orders/${o.id}`,
    })),
    ...photos.map((p) => ({
      type: "photo" as const,
      id: p.id,
      label: p.title,
      sub: `Photo · $${(p.price / 100).toFixed(2)}`,
      href: `/admin/photos/${p.id}/edit`,
    })),
    ...inquiries.map((i) => ({
      type: "inquiry" as const,
      id: i.id,
      label: i.name,
      sub: i.subject,
      href: `/admin/inquiries/${i.id}`,
    })),
  ];

  return NextResponse.json({ results });
}
