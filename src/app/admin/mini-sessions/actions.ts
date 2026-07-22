"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Unauthorized");
}

export async function createMiniSessionDay(formData: FormData) {
  await requireAdmin();

  const title = (formData.get("title") as string).trim();
  const date = formData.get("date") as string;
  const location = (formData.get("location") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const duration = parseInt(formData.get("duration") as string);
  const price = Math.round(parseFloat(formData.get("price") as string) * 100);
  const slotsJson = formData.get("slots") as string;
  const slots: string[] = JSON.parse(slotsJson || "[]");

  if (!title || !date || !duration || !price || slots.length === 0) {
    throw new Error("All fields and at least one time slot are required.");
  }

  const day = await prisma.miniSessionDay.create({
    data: {
      title,
      date: new Date(date),
      location,
      description,
      duration,
      price,
      slots: {
        create: slots.map((time) => ({ startTime: new Date(time) })),
      },
    },
  });

  revalidatePath("/admin/mini-sessions");
  redirect(`/admin/mini-sessions/${day.id}`);
}

export async function togglePublishMiniSession(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const current = formData.get("isPublished") === "true";
  await prisma.miniSessionDay.update({ where: { id }, data: { isPublished: !current } });
  revalidatePath("/admin/mini-sessions");
  revalidatePath(`/admin/mini-sessions/${id}`);
}

export async function deleteMiniSessionDay(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.miniSessionDay.delete({ where: { id } });
  revalidatePath("/admin/mini-sessions");
  redirect("/admin/mini-sessions");
}

export async function deleteSlot(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const dayId = formData.get("dayId") as string;
  await prisma.miniSessionSlot.delete({ where: { id } });
  revalidatePath(`/admin/mini-sessions/${dayId}`);
}

export async function addSlot(formData: FormData) {
  await requireAdmin();
  const dayId = formData.get("dayId") as string;
  const startTime = formData.get("startTime") as string;
  await prisma.miniSessionSlot.create({ data: { dayId, startTime: new Date(startTime) } });
  revalidatePath(`/admin/mini-sessions/${dayId}`);
}
