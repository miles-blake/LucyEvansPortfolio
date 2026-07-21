import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const { limited } = await rateLimit(req, "discount");
  if (limited) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Code required." }, { status: 400 });

  const d = await prisma.discountCode.findUnique({ where: { code } });
  // Return the same message for all invalid states — don't reveal whether the code exists
  if (!d || !d.active) {
    return NextResponse.json({ error: "That code isn't valid." }, { status: 400 });
  }
  if (d.expiresAt && d.expiresAt < new Date()) {
    return NextResponse.json({ error: "That code isn't valid." }, { status: 400 });
  }
  if (d.usageLimit !== null && d.usageCount >= d.usageLimit) {
    return NextResponse.json({ error: "That code isn't valid." }, { status: 400 });
  }

  return NextResponse.json({ type: d.type, amount: d.amount });
}
