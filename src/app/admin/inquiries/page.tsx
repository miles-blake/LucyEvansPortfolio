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

      <div className="border border-border rounded-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-ink/5 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Name</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Subject</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Status</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {inquiries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No inquiries yet.
                </td>
              </tr>
            )}
            {inquiries.map((inq) => (
              <tr key={inq.id} className="hover:bg-ink/5">
                <td className="px-4 py-3 text-ink">{inq.name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{inq.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{inq.subject}</td>
                <td className="px-4 py-3">{statusBadge(inq.status)}</td>
                <td className="px-4 py-3 font-meta text-muted-foreground hidden md:table-cell">
                  {formatDate(inq.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/inquiries/${inq.id}`}
                    className="text-xs text-muted-foreground hover:text-ink"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
