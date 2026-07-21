"use server";
import { auth } from "@/auth";
import { resend } from "@/lib/resend";

export async function sendAdminEmail(data: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };
  if (!data.to || !data.subject || !data.body) return { error: "All fields required." };

  const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
  try {
    await resend.emails.send({
      from,
      to: data.to,
      subject: data.subject,
      html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">${data.body.replace(/\n/g, "<br/>")}<br/><br/>— Lucy Evans<br/><a href="https://lucyevans.com" style="color:#A9C6D8">lucyevans.com</a></div>`,
    });
  } catch (err) {
    console.error("[sendAdminEmail]", err);
    return { error: "Email failed to send." };
  }
  return {};
}
