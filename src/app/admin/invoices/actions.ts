"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { revalidatePath } from "next/cache";

export async function createInvoiceFromBooking(bookingId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { package: true },
  });
  if (!booking) return { error: "Booking not found" };

  const lineItems = [
    { description: `${booking.package.name} — ${booking.eventType}`, amount: booking.totalPrice },
  ];
  if (booking.depositPaid && booking.depositAmount > 0) {
    lineItems.push({ description: "Deposit paid", amount: -booking.depositAmount });
  }

  const number = await nextInvoiceNumber();
  const invoice = await prisma.invoice.create({
    data: {
      number,
      type: "BOOKING",
      bookingId,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone ?? null,
      lineItems,
      subtotal: booking.totalPrice,
      depositPaid: booking.depositPaid ? booking.depositAmount : 0,
      amountDue: booking.totalPrice - (booking.depositPaid ? booking.depositAmount : 0),
      dueDate: new Date(booking.eventDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week before event
      status: "DRAFT",
    },
  });

  revalidatePath("/admin/invoices");
  return { invoiceId: invoice.id };
}

export async function createInvoiceFromOrder(orderId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { photo: true, bundle: true } } },
  });
  if (!order) return { error: "Order not found" };

  const lineItems = order.items.map((item) => ({
    description: item.photo?.title ?? item.bundle?.title ?? "Item",
    amount: item.price,
  }));

  const number = await nextInvoiceNumber();
  const invoice = await prisma.invoice.create({
    data: {
      number,
      type: "ORDER",
      orderId,
      customerName: order.customerEmail,
      customerEmail: order.customerEmail,
      lineItems,
      subtotal: order.totalAmount,
      depositPaid: order.totalAmount, // already fully paid
      amountDue: 0,
      status: "PAID",
    },
  });

  revalidatePath("/admin/invoices");
  return { invoiceId: invoice.id };
}

export async function deleteInvoice(formData: FormData) {
  const session = await auth();
  if (!session) return;
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/admin/invoices");
}

export async function markInvoicePaid(formData: FormData) {
  const session = await auth();
  if (!session) return;
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.invoice.update({ where: { id }, data: { status: "PAID" } });
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${id}`);
}
