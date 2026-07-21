import { prisma } from "@/lib/prisma";
import { InvoiceCreateForm } from "@/components/admin/InvoiceCreateForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — New Invoice" };
export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const [bookingCustomers, orderCustomers, photos, bundles, packages] = await Promise.all([
    prisma.booking.findMany({
      select: { customerName: true, customerEmail: true, customerPhone: true },
      distinct: ["customerEmail"],
      orderBy: { customerName: "asc" },
    }),
    prisma.order.findMany({
      select: { customerEmail: true },
      distinct: ["customerEmail"],
    }),
    prisma.photo.findMany({ select: { id: true, title: true, price: true }, orderBy: { title: "asc" } }),
    prisma.bundle.findMany({ select: { id: true, title: true, price: true }, orderBy: { title: "asc" } }),
    prisma.servicePackage.findMany({ select: { id: true, name: true, basePrice: true }, orderBy: { name: "asc" } }),
  ]);

  // Merge: prefer booking records (which have names), dedupe by email
  const emailsSeen = new Set<string>();
  const customers: { name: string; email: string; phone?: string }[] = [];

  for (const c of bookingCustomers) {
    if (!emailsSeen.has(c.customerEmail)) {
      emailsSeen.add(c.customerEmail);
      customers.push({
        name: c.customerName,
        email: c.customerEmail,
        phone: c.customerPhone ?? undefined,
      });
    }
  }

  for (const c of orderCustomers) {
    if (!emailsSeen.has(c.customerEmail)) {
      emailsSeen.add(c.customerEmail);
      customers.push({ name: c.customerEmail, email: c.customerEmail });
    }
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-2 font-meta text-muted-foreground hover:text-ink transition-colors text-sm mb-6"
      >
        <ArrowLeft size={14} /> All invoices
      </Link>

      <h1 className="font-display text-2xl text-ink mb-8">New invoice</h1>

      <InvoiceCreateForm
        customers={customers}
        catalogItems={[
          ...photos.map((p) => ({ label: p.title, description: p.title, amount: p.price, group: "Photos" })),
          ...bundles.map((b) => ({ label: b.title, description: b.title, amount: b.price, group: "Bundles" })),
          ...packages.map((p) => ({ label: p.name, description: p.name, amount: p.basePrice, group: "Packages" })),
        ]}
      />
    </div>
  );
}
