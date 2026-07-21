"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function updateBookingStatus(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const status = formData.get("status") as "INQUIRY" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

  await prisma.booking.update({ where: { id }, data: { status } });
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}

export async function saveBookingNotes(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const notes = formData.get("notes") as string;
  if (!id) return;
  await prisma.booking.update({ where: { id }, data: { message: notes } });
  revalidatePath(`/admin/bookings/${id}`);
}
