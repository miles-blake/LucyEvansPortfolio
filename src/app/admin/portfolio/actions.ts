"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

function splitLines(val: string) {
  return val.split("\n").map((s) => s.trim()).filter(Boolean);
}

export async function deletePortfolioPiece(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.portfolioPiece.delete({ where: { id } });
  revalidatePath("/admin/portfolio");
  revalidatePath("/work");
}

export async function createPortfolioPiece(formData: FormData) {
  await requireAdmin();

  await prisma.portfolioPiece.create({
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      brandName: formData.get("brandName") as string,
      role: (formData.get("role") as string) || null,
      description: (formData.get("description") as string) || null,
      deliverables: (formData.get("deliverables") as string) || null,
      metrics: (formData.get("metrics") as string) || null,
      videoUrls: splitLines(formData.get("videoUrls") as string),
      originalPostUrls: splitLines(formData.get("originalPostUrls") as string),
      coverImageUrl: (formData.get("coverImageUrl") as string) || null,
      tags: splitLines(formData.get("tags") as string),
      testimonialQuote: (formData.get("testimonialQuote") as string) || null,
      testimonialAuthor: (formData.get("testimonialAuthor") as string) || null,
      featured: formData.get("featured") === "on",
    },
  });

  revalidatePath("/admin/portfolio");
  revalidatePath("/work");
  redirect("/admin/portfolio");
}

export async function updatePortfolioPiece(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  await prisma.portfolioPiece.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      brandName: formData.get("brandName") as string,
      role: (formData.get("role") as string) || null,
      description: (formData.get("description") as string) || null,
      deliverables: (formData.get("deliverables") as string) || null,
      metrics: (formData.get("metrics") as string) || null,
      videoUrls: splitLines(formData.get("videoUrls") as string),
      originalPostUrls: splitLines(formData.get("originalPostUrls") as string),
      coverImageUrl: (formData.get("coverImageUrl") as string) || null,
      tags: splitLines(formData.get("tags") as string),
      testimonialQuote: (formData.get("testimonialQuote") as string) || null,
      testimonialAuthor: (formData.get("testimonialAuthor") as string) || null,
      featured: formData.get("featured") === "on",
    },
  });

  revalidatePath("/admin/portfolio");
  revalidatePath("/work");
  redirect("/admin/portfolio");
}
