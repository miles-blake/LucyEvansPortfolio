"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session) return false;
  return true;
}

export async function markRead(id: string) {
  if (!(await requireAdmin())) return;

  await prisma.inquiry.update({
    where: { id },
    data: { status: "READ" },
  });
  revalidatePath("/admin/inquiries");
}

export async function replyToInquiry(formData: FormData) {
  if (!(await requireAdmin())) return;

  const id = formData.get("id") as string;
  const replyMessage = formData.get("replyMessage") as string;

  if (!id || !replyMessage?.trim()) return;

  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) return;

  const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";

  try {
    await resend.emails.send({
      from,
      to: inquiry.email,
      subject: `Re: ${inquiry.subject}`,
      html: `
        <p>Hi ${inquiry.name},</p>
        <p style="white-space:pre-wrap">${replyMessage}</p>
        <br />
        <p>—</p>
        <p>Lucy Evans<br /><a href="https://lucyevans.com">lucyevans.com</a></p>
      `,
    });
  } catch (err) {
    console.error("[replyToInquiry] Email failed:", err);
  }

  await prisma.inquiry.update({
    where: { id },
    data: { status: "REPLIED", repliedAt: new Date() },
  });

  revalidatePath(`/admin/inquiries/${id}`);
  revalidatePath("/admin/inquiries");
}

export async function saveAdminNotes(formData: FormData) {
  if (!(await requireAdmin())) return;

  const id = formData.get("id") as string;
  const adminNotes = formData.get("adminNotes") as string;

  if (!id) return;

  await prisma.inquiry.update({
    where: { id },
    data: { adminNotes: adminNotes ?? "" },
  });

  revalidatePath(`/admin/inquiries/${id}`);
}

export async function deleteInquiry(formData: FormData) {
  if (!(await requireAdmin())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  await prisma.inquiry.delete({ where: { id } });
  revalidatePath("/admin/inquiries");
}
