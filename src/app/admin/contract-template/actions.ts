"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveContractTemplate(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const body = (formData.get("body") as string) ?? "";

  const existing = await prisma.contractTemplate.findFirst();

  if (existing) {
    await prisma.contractTemplate.update({
      where: { id: existing.id },
      data: { body },
    });
  } else {
    await prisma.contractTemplate.create({
      data: { body },
    });
  }

  revalidatePath("/admin/contract-template");
}
