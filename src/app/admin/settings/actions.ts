"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Unauthorized");
}

export async function updateWatermarkSettings(formData: FormData) {
  await requireAdmin();

  const watermarkText = (formData.get("watermarkText") as string)?.trim();
  const watermarkOpacity = parseInt(formData.get("watermarkOpacity") as string);
  const watermarkPosition = formData.get("watermarkPosition") as string;
  const watermarkFontSize = parseInt(formData.get("watermarkFontSize") as string);

  if (!watermarkText) return { error: "Watermark text is required." };
  if (isNaN(watermarkOpacity) || watermarkOpacity < 0 || watermarkOpacity > 100) {
    return { error: "Opacity must be 0–100." };
  }
  if (isNaN(watermarkFontSize) || watermarkFontSize < 8 || watermarkFontSize > 72) {
    return { error: "Font size must be 8–72." };
  }

  await prisma.siteSettings.upsert({
    where: { id: "main" },
    create: { id: "main", watermarkText, watermarkOpacity, watermarkPosition, watermarkFontSize },
    update: { watermarkText, watermarkOpacity, watermarkPosition, watermarkFontSize },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
