"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function saveOrder(data: {
  orderId: string;
  customerEmail: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  items: Array<{
    id?: string;
    photoId?: string;
    bundleId?: string;
    price: number; // cents
    downloadLimit: number;
  }>;
}): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const totalAmount = data.items.reduce((sum, i) => sum + i.price, 0);

  const incomingIds = data.items.filter((i) => i.id).map((i) => i.id as string);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update the order
      await tx.order.update({
        where: { id: data.orderId },
        data: {
          customerEmail: data.customerEmail,
          status: data.status,
          totalAmount,
        },
      });

      // 2. Delete removed items
      await tx.orderItem.deleteMany({
        where: {
          orderId: data.orderId,
          id: { notIn: incomingIds },
        },
      });

      // 3. Update existing items / create new ones
      for (const item of data.items) {
        if (item.id) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: { price: item.price, downloadLimit: item.downloadLimit },
          });
        } else {
          await tx.orderItem.create({
            data: {
              orderId: data.orderId,
              photoId: item.photoId ?? null,
              bundleId: item.bundleId ?? null,
              price: item.price,
              downloadLimit: item.downloadLimit,
            },
          });
        }
      }
    });
  } catch {
    return { error: "Failed to save order." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${data.orderId}`);
  return {};
}
