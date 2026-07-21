import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Activity log — Admin" };
export const dynamic = "force-dynamic";

function formatMeta(meta: unknown) {
  if (!meta || typeof meta !== "object") return null;
  return Object.entries(meta as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const admins = await prisma.adminUser.findMany({ select: { id: true, name: true } });
  const adminMap = Object.fromEntries(admins.map((a) => [a.id, a.name]));

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-2 font-meta text-muted-foreground hover:text-ink transition-colors text-sm mb-6"
      >
        <ArrowLeft size={14} /> Settings
      </Link>

      <h1 className="font-display text-2xl text-ink mb-8">Activity log</h1>

      {logs.length === 0 ? (
        <p className="font-meta text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <div className="border border-border rounded-sm divide-y divide-border">
          {logs.map((log) => (
            <div key={log.id} className="px-4 py-3 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink font-mono">{log.action}</p>
                {log.targetId && (
                  <p className="font-meta text-xs text-muted-foreground truncate mt-0.5">{log.targetId}</p>
                )}
                {log.meta && (
                  <p className="font-meta text-xs text-muted-foreground mt-0.5">{formatMeta(log.meta)}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-meta text-xs text-muted-foreground">
                  {adminMap[log.adminId] ?? log.adminId}
                </p>
                <p className="font-meta text-xs text-muted-foreground mt-0.5">
                  {log.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
                  {log.createdAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
