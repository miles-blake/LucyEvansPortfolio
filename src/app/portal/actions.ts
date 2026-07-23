"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addMoodboardLink(formData: FormData) {
  const token = formData.get("token") as string;
  const url = (formData.get("url") as string)?.trim();
  if (!token || !url) return;

  const portalToken = await prisma.clientPortalToken.findUnique({
    where: { token },
    select: { bookingId: true, expiresAt: true, booking: { select: { moodboardLinks: true } } },
  });
  if (!portalToken || portalToken.expiresAt < new Date()) return;

  const existing = portalToken.booking.moodboardLinks ?? [];
  if (existing.includes(url) || existing.length >= 20) return;

  await prisma.booking.update({
    where: { id: portalToken.bookingId },
    data: { moodboardLinks: [...existing, url] },
  });

  revalidatePath(`/portal/${token}`);
}

export async function removeMoodboardLink(formData: FormData) {
  const token = formData.get("token") as string;
  const url = formData.get("url") as string;
  if (!token || !url) return;

  const portalToken = await prisma.clientPortalToken.findUnique({
    where: { token },
    select: { bookingId: true, expiresAt: true, booking: { select: { moodboardLinks: true } } },
  });
  if (!portalToken || portalToken.expiresAt < new Date()) return;

  const updated = (portalToken.booking.moodboardLinks ?? []).filter((l) => l !== url);
  await prisma.booking.update({
    where: { id: portalToken.bookingId },
    data: { moodboardLinks: updated },
  });

  revalidatePath(`/portal/${token}`);
}
