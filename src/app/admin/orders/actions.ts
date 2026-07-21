"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { logAdminAction } from "@/lib/audit";

export async function saveOrder(data: {
  orderId: string;
  customerEmail: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  items: Array<{
    id?: string;
    photoId?: string;
    bundleId?: string;
    price: number;
  }>;
}): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const totalAmount = data.items.reduce((sum, i) => sum + i.price, 0);
  const incomingIds = data.items.filter((i) => i.id).map((i) => i.id as string);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: data.orderId },
        data: { customerEmail: data.customerEmail, status: data.status, totalAmount },
      });

      await tx.orderItem.deleteMany({
        where: { orderId: data.orderId, id: { notIn: incomingIds } },
      });

      for (const item of data.items) {
        if (item.id) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: { price: item.price },
          });
        } else {
          await tx.orderItem.create({
            data: {
              orderId: data.orderId,
              photoId: item.photoId ?? null,
              bundleId: item.bundleId ?? null,
              price: item.price,
            },
          });
        }
      }
    });
  } catch {
    return { error: "Failed to save order." };
  }

  await logAdminAction("order.updated", data.orderId, { status: data.status, customerEmail: data.customerEmail });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${data.orderId}`);
  return {};
}
