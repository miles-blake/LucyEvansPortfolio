"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function signContract(formData: FormData) {
  const portalToken = formData.get("portalToken") as string | null;
  const contractId = formData.get("contractId") as string;
  const signedName = (formData.get("signedName") as string)?.trim();

  if (!contractId || !signedName) return { error: "Name is required." };

  let bookingEmail: string | null = null;

  if (portalToken) {
    const pt = await prisma.clientPortalToken.findUnique({
      where: { token: portalToken },
      include: { booking: { select: { customerEmail: true } } },
    });
    if (!pt || pt.expiresAt < new Date()) return { error: "Invalid portal link." };
    bookingEmail = pt.booking.customerEmail;
  } else {
    const session = await auth();
    if (!session || session.user.role !== "client") return { error: "Unauthorized." };
    bookingEmail = session.user.email ?? null;
  }

  const contract = await prisma.bookingContract.findUnique({ where: { id: contractId } });
  if (!contract || contract.signedAt) return { error: "Contract not found or already signed." };

  // Verify the contract belongs to a booking for this client
  const booking = await prisma.booking.findUnique({ where: { id: contract.bookingId } });
  if (!booking || booking.customerEmail !== bookingEmail) return { error: "Unauthorized." };

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  await prisma.bookingContract.update({
    where: { id: contractId },
    data: { signedAt: new Date(), signedName },
  });

  revalidatePath(`/portal/${portalToken ?? ""}`);
  revalidatePath("/account");
  return { success: true };
}
