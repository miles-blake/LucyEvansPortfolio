import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, body } = await req.json();
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Subject and body are required." }, { status: 400 });
  }

  const subscribers = await prisma.subscriber.findMany({
    select: { email: true },
  });

  if (subscribers.length === 0) {
    return NextResponse.json({ error: "No subscribers yet." }, { status: 400 });
  }

  // Convert plain text body to simple HTML (preserve paragraph breaks)
  const htmlBody = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1612;line-height:1.7">
      ${body
        .split(/\n\n+/)
        .map((p: string) => `<p style="margin:0 0 16px">${p.replace(/\n/g, "<br>")}</p>`)
        .join("")}
      <hr style="border:none;border-top:1px solid #e5e1dc;margin:32px 0">
      <p style="font-size:12px;color:#8b7f78">You're receiving this because you subscribed at lucyevans.com. <a href="#" style="color:#8b7f78">Unsubscribe</a></p>
    </div>
  `;

  // Resend batch: max 100 per call — chunk if needed
  const emails = subscribers.map((s) => ({
    from: process.env.RESEND_FROM_EMAIL ?? "Lucy Evans <hello@lucyevans.com>",
    to: s.email,
    subject,
    html: htmlBody,
  }));

  let sent = 0;
  const chunkSize = 100;
  for (let i = 0; i < emails.length; i += chunkSize) {
    await resend.batch.send(emails.slice(i, i + chunkSize));
    sent += Math.min(chunkSize, emails.length - i);
  }

  // Save to newsletter history
  await prisma.newsletter.create({
    data: { subject, body, sentAt: new Date(), recipientCount: sent },
  });

  return NextResponse.json({ ok: true, sent });
}
