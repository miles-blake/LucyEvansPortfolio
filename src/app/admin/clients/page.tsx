import { prisma } from "@/lib/prisma";
import { ClientsListClient } from "./ClientsListClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Clients" };
export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const [bookings, paidOrders, paidInvoices, inquiries, accounts, profiles] = await Promise.all([
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
    prisma.clientProfile.findMany({
      select: { id: true, name: true, emails: true, phones: true },
    }),
  ]);

  type ClientData = {
    id: string; // either "profile:<cuid>" or the email itself
    email: string; // primary email shown in list
    emails: string[]; // all known emails
    name: string;
    phone?: string | null;
    hasAccount: boolean;
    emailVerified: boolean;
    bookingCount: number;
    paidOrderCount: number;
    totalSpent: number;
    lastActivity: Date | null;
  };

  // Build email → profile lookup
  const emailToProfile = new Map<string, (typeof profiles)[number]>();
  for (const profile of profiles) {
    for (const e of profile.emails) {
      emailToProfile.set(e.toLowerCase(), profile);
    }
  }

  // map key: "profile:<id>" for profiled entries, or email for standalone
  const map = new Map<string, ClientData>();

  function getOrCreate(email: string): ClientData {
    const lc = email.toLowerCase();
    const profile = emailToProfile.get(lc);

    if (profile) {
      const key = `profile:${profile.id}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          email: profile.emails[0] ?? email,
          emails: profile.emails,
          name: profile.name,
          phone: profile.phones[0] ?? null,
          hasAccount: false,
          emailVerified: false,
          bookingCount: 0,
          paidOrderCount: 0,
          totalSpent: 0,
          lastActivity: null,
        });
      }
      return map.get(key)!;
    }

    if (!map.has(email)) {
      map.set(email, {
        id: email,
        email,
        emails: [email],
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
    if (acc.name && !entry.id.startsWith("profile:")) entry.name = acc.name;
  }

  for (const b of bookings) {
    const entry = getOrCreate(b.customerEmail);
    entry.bookingCount += 1;
    if (b.customerPhone && !entry.phone) entry.phone = b.customerPhone;
    if (entry.name === entry.email && b.customerName) entry.name = b.customerName;
    updateLastActivity(entry, b.createdAt);
  }

  for (const o of paidOrders) {
    const entry = getOrCreate(o.customerEmail);
    entry.paidOrderCount += 1;
    entry.totalSpent += o.totalAmount;
    if (entry.name === entry.email && o.customerName) entry.name = o.customerName;
    updateLastActivity(entry, o.createdAt);
  }

  for (const inv of paidInvoices) {
    const entry = getOrCreate(inv.customerEmail);
    entry.totalSpent += inv.amountDue;
    if (entry.name === entry.email && inv.customerName) entry.name = inv.customerName;
    updateLastActivity(entry, inv.createdAt);
  }

  for (const inq of inquiries) {
    const entry = getOrCreate(inq.email);
    if (entry.name === entry.email && inq.name) entry.name = inq.name;
    updateLastActivity(entry, inq.createdAt);
  }

  // ── Duplicate detection (only for non-profiled entries) ────────────

  function normalizeName(n: string) {
    return n.toLowerCase().trim().replace(/\s+/g, " ");
  }

  // Collect standalone (non-profile) entries
  const standalones = Array.from(map.values()).filter(
    (c) => !c.id.startsWith("profile:")
  );

  type DuplicatePair = [ClientData, ClientData];
  const seenPairs = new Set<string>();
  const duplicatePairs: DuplicatePair[] = [];

  for (let i = 0; i < standalones.length; i++) {
    for (let j = i + 1; j < standalones.length; j++) {
      const a = standalones[i];
      const b = standalones[j];

      // Skip if either is an email-like name (no real name yet)
      const aName = normalizeName(a.name);
      const bName = normalizeName(b.name);
      const aIsEmail = aName === a.email.toLowerCase();
      const bIsEmail = bName === b.email.toLowerCase();
      if (aIsEmail || bIsEmail) continue;

      let isDuplicate = false;

      // Exact name match
      if (aName === bName) {
        isDuplicate = true;
      }

      // Shared phone
      if (!isDuplicate && a.phone && b.phone && a.phone === b.phone) {
        isDuplicate = true;
      }

      // Fuzzy token match: all tokens of the shorter appear in the longer
      if (!isDuplicate) {
        const aTokens = aName.split(" ");
        const bTokens = bName.split(" ");
        const [shorter, longer] =
          aTokens.length <= bTokens.length ? [aTokens, bTokens] : [bTokens, aTokens];
        if (shorter.length > 0 && shorter.every((t) => longer.includes(t))) {
          isDuplicate = true;
        }
      }

      if (isDuplicate) {
        const pairKey = [a.email, b.email].sort().join("|");
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          duplicatePairs.push([a, b]);
        }
      }
    }
  }

  const clients = Array.from(map.values())
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
    .map((c) => ({
      ...c,
      lastActivity: c.lastActivity ? c.lastActivity.toISOString() : null,
    }));

  const serializedPairs = duplicatePairs.map(([a, b]) => [
    { ...a, lastActivity: a.lastActivity ? a.lastActivity.toISOString() : null },
    { ...b, lastActivity: b.lastActivity ? b.lastActivity.toISOString() : null },
  ]) as [
    (typeof clients)[number],
    (typeof clients)[number],
  ][];

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">Clients</h1>
      </div>
      <ClientsListClient clients={clients} duplicatePairs={serializedPairs} />
    </div>
  );
}
