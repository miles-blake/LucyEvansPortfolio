import "server-only";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

export async function logAdminAction(
  action: string,
  targetId?: string,
  meta?: Record<string, unknown>
) {
  try {
    const session = await auth();
    const adminId = session?.user?.id ?? "unknown";
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetId: targetId ?? null,
        meta: meta ? (meta as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (err) {
    // Audit logging should never break the main action
    console.error("[audit]", err);
  }
}
