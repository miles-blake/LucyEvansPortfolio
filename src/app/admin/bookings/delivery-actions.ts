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

  await prisma.deliveredAsset.create({
    data: { bookingId, name: name || "Photo", url, publicId },
  });
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
