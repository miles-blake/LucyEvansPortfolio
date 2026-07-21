"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function deleteService(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.servicePackage.delete({ where: { id } });
  revalidatePath("/admin/services");
  revalidatePath("/services");
}

export async function createService(formData: FormData) {
  await requireAdmin();
  const basePrice = Math.round(parseFloat(formData.get("priceDisplay") as string) * 100);
  const extraRollPrice = Math.round(parseFloat(formData.get("extraRollPriceDisplay") as string || "0") * 100);
  const rushDeliveryPrice = Math.round(parseFloat(formData.get("rushDeliveryPriceDisplay") as string || "0") * 100);
  const secondShooterPrice = Math.round(parseFloat(formData.get("secondShooterPriceDisplay") as string || "0") * 100);

  const eventTypes = (formData.get("eventTypes") as string)
    .split(",").map((s) => s.trim()).filter(Boolean);

  const hoursRaw = formData.get("hoursIncluded") as string;
  const hoursIncluded = hoursRaw ? parseInt(hoursRaw) : null;

  await prisma.servicePackage.create({
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      rollsIncluded: parseInt(formData.get("rollsIncluded") as string),
      photosIncluded: parseInt(formData.get("photosIncluded") as string),
      hoursIncluded,
      basePrice,
      eventTypes,
      addOnPricing: { extraRollPrice, rushDeliveryPrice, secondShooterPrice },
    },
  });

  revalidatePath("/admin/services");
  revalidatePath("/services");
  redirect("/admin/services");
}

export async function updateService(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const basePrice = Math.round(parseFloat(formData.get("priceDisplay") as string) * 100);
  const extraRollPrice = Math.round(parseFloat(formData.get("extraRollPriceDisplay") as string || "0") * 100);
  const rushDeliveryPrice = Math.round(parseFloat(formData.get("rushDeliveryPriceDisplay") as string || "0") * 100);
  const secondShooterPrice = Math.round(parseFloat(formData.get("secondShooterPriceDisplay") as string || "0") * 100);

  const eventTypes = (formData.get("eventTypes") as string)
    .split(",").map((s) => s.trim()).filter(Boolean);

  const hoursRaw = formData.get("hoursIncluded") as string;
  const hoursIncluded = hoursRaw ? parseInt(hoursRaw) : null;

  await prisma.servicePackage.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      rollsIncluded: parseInt(formData.get("rollsIncluded") as string),
      photosIncluded: parseInt(formData.get("photosIncluded") as string),
      hoursIncluded,
      basePrice,
      eventTypes,
      addOnPricing: { extraRollPrice, rushDeliveryPrice, secondShooterPrice },
    },
  });

  revalidatePath("/admin/services");
  revalidatePath("/services");
  redirect("/admin/services");
}
