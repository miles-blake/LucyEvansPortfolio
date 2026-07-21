"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function sendClientMessage(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "client") throw new Error("Unauthorized");

  const bookingId = formData.get("bookingId") as string;
  const body = (formData.get("body") as string)?.trim();
  if (!bookingId || !body) return;

  // Verify this booking belongs to the client
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.customerEmail !== session.user.email) return;

  await prisma.bookingMessage.create({
    data: { bookingId, senderRole: "client", body },
  });

  revalidatePath("/account");
}

export async function sendPortalMessage(formData: FormData) {
  const portalToken = formData.get("portalToken") as string;
  const body = (formData.get("body") as string)?.trim();
  if (!portalToken || !body) return;

  const pt = await prisma.clientPortalToken.findUnique({
    where: { token: portalToken },
    select: { bookingId: true, expiresAt: true },
  });
  if (!pt || pt.expiresAt < new Date()) return;

  await prisma.bookingMessage.create({
    data: { bookingId: pt.bookingId, senderRole: "client", body },
  });

  revalidatePath(`/portal/${portalToken}`);
}
