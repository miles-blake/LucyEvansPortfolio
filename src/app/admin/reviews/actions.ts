"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function approveReview(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.review.update({ where: { id }, data: { approved: true } });
  revalidatePath("/admin/reviews");
}

export async function unapproveReview(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.review.update({ where: { id }, data: { approved: false } });
  revalidatePath("/admin/reviews");
}

export async function deleteReview(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
}
