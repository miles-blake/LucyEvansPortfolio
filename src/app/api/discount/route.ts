import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Code required." }, { status: 400 });

  const d = await prisma.discountCode.findUnique({ where: { code } });
  if (!d || !d.active) return NextResponse.json({ error: "Invalid discount code." }, { status: 400 });
  if (d.expiresAt && d.expiresAt < new Date()) {
    return NextResponse.json({ error: "This discount code has expired." }, { status: 400 });
  }
  if (d.usageLimit !== null && d.usageCount >= d.usageLimit) {
    return NextResponse.json({ error: "This discount code has reached its usage limit." }, { status: 400 });
  }

  return NextResponse.json({ type: d.type, amount: d.amount });
}
