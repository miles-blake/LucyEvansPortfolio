"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function deleteBundle(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.bundle.delete({ where: { id } });
  revalidatePath("/admin/bundles");
  revalidatePath("/bundles");
}

export async function createBundle(formData: FormData) {
  await requireAdmin();
  const price = Math.round(parseFloat(formData.get("priceDisplay") as string) * 100);
  // photoIds is a comma-separated list
  const photoIds = (formData.get("photoIds") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.bundle.create({
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: (formData.get("description") as string) || null,
      price,
      featured: formData.get("featured") === "on",
      photos: {
        create: photoIds.map((photoId) => ({ photoId })),
      },
    },
  });

  revalidatePath("/admin/bundles");
  revalidatePath("/bundles");
  redirect("/admin/bundles");
}

export async function updateBundle(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const price = Math.round(parseFloat(formData.get("priceDisplay") as string) * 100);
  const photoIds = (formData.get("photoIds") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.bundle.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: (formData.get("description") as string) || null,
      price,
      featured: formData.get("featured") === "on",
      photos: {
        deleteMany: {},
        create: photoIds.map((photoId) => ({ photoId })),
      },
    },
  });

  revalidatePath("/admin/bundles");
  revalidatePath("/bundles");
  redirect("/admin/bundles");
}
