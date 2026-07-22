import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.email(),
  phone: z.string().max(30).nullable().optional(),
  packageInterest: z.string().max(200).nullable().optional(),
  reason: z.string().max(200).nullable().optional(),
  commPref: z.string().max(10).optional(),
  subject: z.string().min(1).max(300),
  message: z.string().min(1).max(4000),
});

export async function POST(req: NextRequest) {
  const { limited } = await rateLimit(req, "contact");
  if (limited) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, packageInterest, reason, commPref, subject, message } = schema.parse(body);

    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        phone: phone ?? null,
        packageInterest: packageInterest ?? null,
        reason: reason ?? null,
        commPref: commPref ?? "email",
        subject,
        message,
      },
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
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          ${packageInterest ? `<p><strong>Package interest:</strong> ${packageInterest}</p>` : ""}
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p><strong>Prefers:</strong> ${commPref ?? "email"}</p>
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
