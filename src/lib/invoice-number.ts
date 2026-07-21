import "server-only";
import { prisma } from "@/lib/prisma";

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  const seq = String(count + 1).padStart(3, "0");
  return `INV-${year}-${seq}`;
}
