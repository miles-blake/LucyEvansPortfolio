"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createBulkPhotos(data: {
  photos: Array<{
    title: string;
    previewImageUrl: string;
    fullResFileUrl: string;
  }>;
  shared: {
    filmStock: string;
    camera: string;
    collectionTag: string;
    location: string;
  };
}): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };
  if (data.photos.length === 0) return { error: "No photos to save." };

  function slugify(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  try {
    await prisma.$transaction(
      data.photos.map((photo) =>
        prisma.photo.create({
          data: {
            title: photo.title,
            slug: `${slugify(photo.title)}-${Date.now()}`,
            previewImageUrl: photo.previewImageUrl,
            fullResFileUrl: photo.fullResFileUrl,
            price: 0,
            filmStock: data.shared.filmStock || null,
            camera: data.shared.camera || null,
            collectionTag: data.shared.collectionTag || null,
            location: data.shared.location || null,
          },
        })
      )
    );
  } catch (err) {
    console.error("[createBulkPhotos]", err);
    return { error: "Failed to save photos." };
  }

  revalidatePath("/admin/photos");
  revalidatePath("/gallery");
  return {};
}
