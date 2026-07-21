import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.email(),
  source: z.string().optional().default("unknown"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source } = schema.parse(body);

    await prisma.subscriber.upsert({
      where: { email },
      update: { source },
      create: { email, source, confirmed: false },
    });

    // TODO: Send welcome email via Resend once API key is configured
    // import { resend } from "@/lib/resend";
    // await resend.emails.send({ from: "Lucy Evans <hello@lucyevans.com>", to: email, ... });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    console.error("Newsletter signup error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
