"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function deletePhoto(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.photo.delete({ where: { id } });
  revalidatePath("/admin/photos");
  revalidatePath("/gallery");
}

export async function createPhoto(formData: FormData) {
  await requireAdmin();

  const price = Math.round(parseFloat(formData.get("priceDisplay") as string) * 100);
  const isLimitedEdition = formData.get("isLimitedEdition") === "on";
  const editionSize = isLimitedEdition ? parseInt(formData.get("editionSize") as string) : null;

  await prisma.photo.create({
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: (formData.get("description") as string) || null,
      location: (formData.get("location") as string) || null,
      filmStock: (formData.get("filmStock") as string) || null,
      camera: (formData.get("camera") as string) || null,
      collectionTag: (formData.get("collectionTag") as string) || null,
      previewImageUrl: formData.get("previewImageUrl") as string,
      fullResFileUrl: formData.get("fullResFileUrl") as string,
      price,
      featured: formData.get("featured") === "on",
      isLimitedEdition,
      editionSize,
    },
  });

  revalidatePath("/admin/photos");
  revalidatePath("/gallery");
  redirect("/admin/photos");
}

export async function updatePhoto(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const price = Math.round(parseFloat(formData.get("priceDisplay") as string) * 100);
  const isLimitedEdition = formData.get("isLimitedEdition") === "on";
  const editionSize = isLimitedEdition ? parseInt(formData.get("editionSize") as string) : null;

  await prisma.photo.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: (formData.get("description") as string) || null,
      location: (formData.get("location") as string) || null,
      filmStock: (formData.get("filmStock") as string) || null,
      camera: (formData.get("camera") as string) || null,
      collectionTag: (formData.get("collectionTag") as string) || null,
      previewImageUrl: formData.get("previewImageUrl") as string,
      fullResFileUrl: formData.get("fullResFileUrl") as string,
      price,
      featured: formData.get("featured") === "on",
      isLimitedEdition,
      editionSize,
    },
  });

  revalidatePath("/admin/photos");
  revalidatePath("/gallery");
  redirect("/admin/photos");
}
