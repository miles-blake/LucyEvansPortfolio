import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

const schema = z.object({
  name: z.string().min(1),
  email: z.email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = schema.parse(body);

    const inquiry = await prisma.inquiry.create({
      data: { name, email, subject, message },
    });

    const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";

    try {
      await resend.emails.send({
        from,
        to: from,
        subject: `New inquiry: ${subject}`,
        html: `
          <h2>New contact inquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap">${message}</p>
          <hr />
          <p><small>View in admin: /admin/inquiries/${inquiry.id}</small></p>
        `,
      });
    } catch (emailErr) {
      console.error("[contact] Failed to send notification email:", emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Please fill in all required fields correctly." }, { status: 400 });
    }
    console.error("[contact] Error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
