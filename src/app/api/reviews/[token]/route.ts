import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

interface Params { params: Promise<{ token: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const review = await prisma.review.findUnique({ where: { token } });
  if (!review) return NextResponse.json({ valid: false });
  return NextResponse.json({
    valid: true,
    clientName: review.clientName,
    alreadySubmitted: review.rating > 0,
  });
}

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const review = await prisma.review.findUnique({ where: { token } });
  if (!review) return NextResponse.json({ error: "Invalid link." }, { status: 404 });
  if (review.rating > 0) return NextResponse.json({ error: "Already submitted." }, { status: 409 });

  try {
    const body = await req.json();
    const data = schema.parse(body);
    await prisma.review.update({
      where: { token },
      data: { rating: data.rating, body: data.body },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }
}
