"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Unauthorized");
}

export async function addBlackoutDate(formData: FormData) {
  await requireAdmin();
  const dateStr = formData.get("date") as string;
  const reason = (formData.get("reason") as string)?.trim() || null;
  if (!dateStr) return;

  const date = new Date(dateStr + "T12:00:00Z");
  await prisma.blackoutDate.create({ data: { date, reason } });

  revalidatePath("/admin/availability");
}

export async function deleteBlackoutDate(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.blackoutDate.delete({ where: { id } });
  revalidatePath("/admin/availability");
}
