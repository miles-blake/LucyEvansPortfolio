import { prisma } from "@/lib/prisma";
import { ClientsListClient } from "./ClientsListClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Clients" };
export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const [bookings, paidOrders, paidInvoices, inquiries, accounts] = await Promise.all([
    prisma.booking.findMany({
      select: {
        customerEmail: true,
        customerName: true,
        customerPhone: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        id: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { status: "PAID" },
      select: { customerEmail: true, customerName: true, totalAmount: true, createdAt: true },
    }),
    prisma.invoice.findMany({
      where: { status: "PAID" },
      select: { customerEmail: true, customerName: true, amountDue: true, createdAt: true },
    }),
    prisma.inquiry.findMany({
      select: { email: true, name: true, createdAt: true },
    }),
    prisma.client.findMany({
      select: { email: true, name: true, emailVerified: true },
    }),
  ]);

  type ClientData = {
    email: string;
    name: string;
    phone?: string | null;
    hasAccount: boolean;
    emailVerified: boolean;
    bookingCount: number;
    paidOrderCount: number;
    totalSpent: number;
    lastActivity: Date | null;
  };

  const map = new Map<string, ClientData>();

  function getOrCreate(email: string): ClientData {
    if (!map.has(email)) {
      map.set(email, {
        email,
        name: email,
        phone: null,
        hasAccount: false,
        emailVerified: false,
        bookingCount: 0,
        paidOrderCount: 0,
        totalSpent: 0,
        lastActivity: null,
      });
    }
    return map.get(email)!;
  }

  function updateLastActivity(entry: ClientData, date: Date) {
    if (!entry.lastActivity || date > entry.lastActivity) {
      entry.lastActivity = date;
    }
  }

  for (const acc of accounts) {
    const entry = getOrCreate(acc.email);
    entry.hasAccount = true;
    entry.emailVerified = acc.emailVerified;
    if (acc.name) entry.name = acc.name;
  }

  for (const b of bookings) {
    const entry = getOrCreate(b.customerEmail);
    entry.bookingCount += 1;
    if (b.customerPhone && !entry.phone) entry.phone = b.customerPhone;
    if (entry.name === b.customerEmail && b.customerName) entry.name = b.customerName;
    updateLastActivity(entry, b.createdAt);
  }

  for (const o of paidOrders) {
    const entry = getOrCreate(o.customerEmail);
    entry.paidOrderCount += 1;
    entry.totalSpent += o.totalAmount;
    if (entry.name === o.customerEmail && o.customerName) entry.name = o.customerName;
    updateLastActivity(entry, o.createdAt);
  }

  for (const inv of paidInvoices) {
    const entry = getOrCreate(inv.customerEmail);
    entry.totalSpent += inv.amountDue;
    if (entry.name === inv.customerEmail && inv.customerName) entry.name = inv.customerName;
    updateLastActivity(entry, inv.createdAt);
  }

  for (const inq of inquiries) {
    const entry = getOrCreate(inq.email);
    if (entry.name === inq.email && inq.name) entry.name = inq.name;
    updateLastActivity(entry, inq.createdAt);
  }

  const clients = Array.from(map.values())
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
    .map((c) => ({
      ...c,
      lastActivity: c.lastActivity ? c.lastActivity.toISOString() : null,
    }));

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">Clients</h1>
      </div>
      <ClientsListClient clients={clients} />
    </div>
  );
}
