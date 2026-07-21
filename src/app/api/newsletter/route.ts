import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.email(),
  source: z.string().optional().default("unknown"),
});

export async function POST(req: NextRequest) {
  const { limited } = await rateLimit(req, "newsletter");
  if (limited) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email, source } = schema.parse(body);

    await prisma.subscriber.upsert({
      where: { email },
      update: { source, confirmed: true },
      create: { email, source, confirmed: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    console.error("Newsletter signup error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
