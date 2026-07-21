import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Inquiries" };
export const dynamic = "force-dynamic";

function statusBadge(status: "NEW" | "READ" | "REPLIED") {
  if (status === "NEW") {
    return (
      <span className="font-meta text-xs bg-rose/10 text-rose px-2 py-0.5 rounded-sm">
        New
      </span>
    );
  }
  if (status === "READ") {
    return (
      <span className="font-meta text-xs bg-ink/10 text-muted-foreground px-2 py-0.5 rounded-sm">
        Read
      </span>
    );
  }
  return (
    <span className="font-meta text-xs bg-sage/20 text-sage px-2 py-0.5 rounded-sm">
      Replied
    </span>
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminInquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl text-ink mb-6">Inquiries</h1>

      <div className="border border-border rounded-sm">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 border-b border-border">
            <tr>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal">Name</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Email</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal">Subject</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal">Status</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {inquiries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No inquiries yet.
                </td>
              </tr>
            )}
            {inquiries.map((inq) => (
              <tr key={inq.id} className="relative hover:bg-ink/5 cursor-pointer">
                <td className="px-3 md:px-4 py-3 text-ink">
                  <Link href={`/admin/inquiries/${inq.id}`} className="absolute inset-0 z-0" aria-label={`View inquiry from ${inq.name}`} />
                  {inq.name}
                </td>
                <td className="px-3 md:px-4 py-3 text-muted-foreground hidden md:table-cell">{inq.email}</td>
                <td className="px-3 md:px-4 py-3 text-muted-foreground">
                  <span className="line-clamp-1">{inq.subject}</span>
                </td>
                <td className="px-3 md:px-4 py-3">{statusBadge(inq.status)}</td>
                <td className="px-3 md:px-4 py-3 font-meta text-muted-foreground hidden md:table-cell">
                  {formatDate(inq.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
