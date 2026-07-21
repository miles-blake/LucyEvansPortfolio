import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { toggleDiscountCode, deleteDiscountCode } from "./actions";
import { CreateDiscountForm } from "./CreateDiscountForm";

export const metadata: Metadata = { title: "Discount Codes" };
export const dynamic = "force-dynamic";

function fmt(d: { type: string; amount: number }) {
  return d.type === "percent" ? `${d.amount}% off` : `$${(d.amount / 100).toFixed(0)} off`;
}

export default async function DiscountsPage() {
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="font-display text-2xl text-ink">Discount codes</h1>

      {/* Create form */}
      <section className="border border-border rounded-sm p-6">
        <h2 className="font-display text-lg text-ink mb-4">New code</h2>
        <CreateDiscountForm />
      </section>

      {/* Existing codes */}
      {codes.length === 0 ? (
        <p className="font-meta text-sm text-muted-foreground">No discount codes yet.</p>
      ) : (
        <section>
          <h2 className="font-display text-lg text-ink mb-4">Active codes</h2>
          <div className="border border-border rounded-sm divide-y divide-border">
            {codes.map((d) => (
              <div key={d.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-meta text-sm text-ink">{d.code}</p>
                  <p className="font-meta text-xs text-muted-foreground mt-0.5">
                    {fmt(d)}
                    {d.usageLimit ? ` · ${d.usageCount}/${d.usageLimit} uses` : ` · ${d.usageCount} uses`}
                    {d.expiresAt ? ` · Expires ${d.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                  </p>
                </div>
                <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${d.active ? "bg-sage/20 text-sage" : "bg-ink/10 text-muted-foreground"}`}>
                  {d.active ? "active" : "inactive"}
                </span>
                <form action={toggleDiscountCode}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="active" value={String(d.active)} />
                  <button type="submit" className="font-meta text-xs text-muted-foreground hover:text-ink transition-colors">
                    {d.active ? "Disable" : "Enable"}
                  </button>
                </form>
                <form action={deleteDiscountCode}>
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" className="font-meta text-xs text-muted-foreground hover:text-rose-500 transition-colors">
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
