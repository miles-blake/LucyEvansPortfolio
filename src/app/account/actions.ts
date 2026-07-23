"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";

export async function registerClient(_prev: unknown, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) return { error: "All fields are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!/[0-9]/.test(password)) return { error: "Password must include at least one number." };
  if (!/[A-Z]/.test(password)) return { error: "Password must include at least one uppercase letter." };

  const existing = await prisma.client.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const hashedPassword = await bcrypt.hash(password, 10);
  const client = await prisma.client.create({ data: { name, email, hashedPassword } });

  // Send verification email
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
  const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
  if (client.emailVerifyToken) {
    try {
      const { resend } = await import("@/lib/resend");
      await resend.emails.send({
        from,
        to: email,
        subject: "Verify your email — Lucy Evans Photography",
        html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
          <p>Hi ${name},</p>
          <p>Thanks for creating an account! Please verify your email address to see your bookings and invoices:</p>
          <p><a href="${siteUrl}/api/account/verify-email/${client.emailVerifyToken}" style="display:inline-block;background:#2E2A24;color:#F8F4EF;padding:10px 20px;border-radius:2px;text-decoration:none;font-size:14px">Verify email address</a></p>
          <p style="color:#888;font-size:13px">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
          <p>— Lucy Evans Photography</p>
        </div>`,
      });
    } catch (err) {
      console.error("[register] verification email failed:", err);
    }
  }

  // Log them in — they'll see a verification banner until they click the link
  try {
    await signIn("client", { email, password, redirectTo: "/account" });
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
    redirect("/account");
  }
}

export async function loginClient(_prev: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  try {
    await signIn("client", { email, password, redirectTo: "/account" });
  } catch (err) {
    // Re-throw Next.js redirect (successful login)
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { error: "Invalid email or password." };
  }
}
