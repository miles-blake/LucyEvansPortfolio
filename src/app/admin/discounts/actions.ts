"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Unauthorized");
}

export async function createDiscountCode(formData: FormData) {
  await requireAdmin();
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const type = formData.get("type") as "fixed" | "percent";
  const amountRaw = parseFloat(formData.get("amount") as string);
  const usageLimitRaw = formData.get("usageLimit") as string;
  const expiresAtRaw = formData.get("expiresAt") as string;

  if (!code || !type || isNaN(amountRaw)) return { error: "Code, type, and amount are required." };

  const amount = type === "fixed" ? Math.round(amountRaw * 100) : Math.round(amountRaw);
  if (type === "percent" && (amount < 1 || amount > 100)) return { error: "Percentage must be 1–100." };

  const existing = await prisma.discountCode.findUnique({ where: { code } });
  if (existing) return { error: "That code already exists." };

  await prisma.discountCode.create({
    data: {
      code,
      type,
      amount,
      usageLimit: usageLimitRaw ? parseInt(usageLimitRaw) : null,
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
    },
  });

  revalidatePath("/admin/discounts");
}

export async function toggleDiscountCode(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const active = formData.get("active") === "true";
  await prisma.discountCode.update({ where: { id }, data: { active: !active } });
  revalidatePath("/admin/discounts");
}

export async function deleteDiscountCode(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.discountCode.delete({ where: { id } });
  revalidatePath("/admin/discounts");
}
