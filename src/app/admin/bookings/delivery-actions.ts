"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { cloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Unauthorized");
}

export async function deleteDeliveredAsset(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const publicId = formData.get("publicId") as string;
  const bookingId = formData.get("bookingId") as string;
  if (!id) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    // proceed even if Cloudinary deletion fails
  }
  await prisma.deliveredAsset.delete({ where: { id } });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function saveDeliveredAsset(formData: FormData) {
  await requireAdmin();
  const bookingId = formData.get("bookingId") as string;
  const name = formData.get("name") as string;
  const url = formData.get("url") as string;
  const publicId = formData.get("publicId") as string;
  if (!bookingId || !url || !publicId) return;

  // Count existing assets before creating, to detect first upload
  const existingCount = await prisma.deliveredAsset.count({ where: { bookingId } });

  await prisma.deliveredAsset.create({
    data: { bookingId, name: name || "Photo", url, publicId },
  });

  // If this is the first delivered asset, notify the client
  if (existingCount === 0) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { customerName: true, customerEmail: true, portalToken: { select: { token: true } } },
      });
      if (booking) {
        const { resend } = await import("@/lib/resend");
        const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
        const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
        const firstName = booking.customerName.split(" ")[0];
        const portalUrl = booking.portalToken
          ? `${siteUrl}/portal/${booking.portalToken.token}`
          : `${siteUrl}/account`;
        await resend.emails.send({
          from,
          to: booking.customerEmail,
          subject: "Your photos are ready — Lucy Evans Photography",
          html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
  <p>Hi ${firstName},</p>
  <p>Exciting news — your photos are ready! Lucy has delivered your gallery and you can view and download them now at your private portal:</p>
  <p><a href="${portalUrl}" style="display:inline-block;background:#2E2A24;color:#F5F0EA;padding:10px 20px;border-radius:3px;text-decoration:none;font-size:14px">View your gallery →</a></p>
  <p>— Lucy Evans<br/><a href="${siteUrl}" style="color:#A9C6D8">lucyevans.com</a></p>
</div>`,
        });
      }
    } catch (err) {
      console.error("[gallery-ready]", err);
    }
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function uploadContract(formData: FormData) {
  await requireAdmin();
  const bookingId = formData.get("bookingId") as string;
  const pdfUrl = (formData.get("pdfUrl") as string)?.trim();
  if (!bookingId || !pdfUrl) return;

  await prisma.bookingContract.upsert({
    where: { bookingId },
    create: { bookingId, pdfUrl },
    update: { pdfUrl, signedAt: null, signedName: null },
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function deleteContract(formData: FormData) {
  await requireAdmin();
  const bookingId = formData.get("bookingId") as string;
  if (!bookingId) return;
  await prisma.bookingContract.deleteMany({ where: { bookingId } });
  revalidatePath(`/admin/bookings/${bookingId}`);
}
