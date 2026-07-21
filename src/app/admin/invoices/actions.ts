"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { revalidatePath } from "next/cache";
import { resend } from "@/lib/resend";

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

export async function createCustomInvoice(data: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  lineItems: Array<{ description: string; amount: number }>; // cents
  dueDate?: string;
  notes?: string;
}): Promise<{ invoiceId?: string; error?: string }> {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const subtotal = data.lineItems.reduce((sum, i) => sum + i.amount, 0);
  const number = await nextInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      number,
      type: "BOOKING", // custom invoices use BOOKING type
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone ?? null,
      lineItems: data.lineItems,
      subtotal,
      depositPaid: 0,
      amountDue: subtotal,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes ?? null,
      status: "DRAFT",
    },
  });

  revalidatePath("/admin/invoices");
  return { invoiceId: invoice.id };
}

export async function sendInvoiceEmail(formData: FormData) {
  const session = await auth();
  if (!session) return;
  const id = formData.get("id") as string;
  if (!id) return;

  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) return;

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const React = await import("react");
  const { InvoicePDF } = await import("@/components/InvoicePDF");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = React.default.createElement(InvoicePDF, { invoice: inv as any }) as any;
  const buffer: Buffer = await renderToBuffer(el);

  const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
  const dueStr = inv.dueDate
    ? ` — due ${new Date(inv.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
    : "";

  try {
    await resend.emails.send({
      from,
      to: inv.customerEmail,
      subject: `Invoice ${inv.number} from Lucy Evans Photography`,
      html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24"><p>Hi ${inv.customerName},</p><p>Please find your invoice ${inv.number} attached.</p>${inv.notes ? `<p>${inv.notes}</p>` : ""}<p><strong>Amount due: $${(inv.amountDue / 100).toFixed(2)}${dueStr}</strong></p><p>— Lucy Evans<br/><a href="https://lucyevans.com" style="color:#A9C6D8">lucyevans.com</a></p></div>`,
      attachments: [{ filename: `${inv.number}.pdf`, content: buffer }],
    });
  } catch (err) {
    console.error("[sendInvoiceEmail]", err);
  }

  await prisma.invoice.update({ where: { id }, data: { status: "SENT" } });
  revalidatePath(`/admin/invoices/${id}`);
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
