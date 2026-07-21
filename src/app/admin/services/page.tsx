import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteService } from "./actions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Services" };
export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const packages = await prisma.servicePackage.findMany({ orderBy: { basePrice: "asc" } });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Service packages</h1>
        <Link href="/admin/services/new" className="bg-ink text-cream text-sm px-4 py-2 rounded-sm hover:opacity-80 transition-opacity">
          + New package
        </Link>
      </div>

      <div className="border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Name</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Rolls</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Price</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Types</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {packages.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No packages yet.</td></tr>
            )}
            {packages.map((p) => (
              <tr key={p.id} className="relative hover:bg-ink/5 cursor-pointer">
                <td className="px-4 py-3 text-ink">
                  <Link href={`/admin/services/${p.id}/edit`} className="absolute inset-0 z-0" aria-label={`Edit ${p.name}`} />
                  {p.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.rollsIncluded}</td>
                <td className="px-4 py-3 font-meta text-muted-foreground hidden md:table-cell">${(p.basePrice / 100).toFixed(0)}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.eventTypes.join(", ")}</td>
                <td className="px-4 py-3">
                  <div className="relative z-10 flex items-center gap-3 justify-end">
                    <Link href={`/admin/services/${p.id}/edit`} className="text-xs text-muted-foreground hover:text-ink">Edit</Link>
                    <DeleteButton action={deleteService} id={p.id} label={p.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
