import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns current prices for a list of photo IDs so the wishlist can stay fresh
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  if (ids.length === 0) return NextResponse.json({});

  const photos = await prisma.photo.findMany({
    where: { id: { in: ids } },
    select: { id: true, price: true },
  });

  const map = Object.fromEntries(photos.map((p) => [p.id, p.price]));
  return NextResponse.json(map);
}
