"use client";

import { useActionState } from "react";
import { createDiscountCode } from "./actions";

export function CreateDiscountForm() {
  const [state, formAction, pending] = useActionState(
    createDiscountCode as (prev: unknown, fd: FormData) => Promise<{ error?: string } | undefined>,
    undefined
  );

  return (
    <form action={formAction} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <div className="col-span-2 sm:col-span-1">
        <label className="font-meta text-xs text-muted-foreground block mb-1">Code</label>
        <input
          name="code"
          required
          placeholder="SUMMER20"
          className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink uppercase focus:outline-none focus:ring-1 focus:ring-ink/30"
        />
      </div>
      <div>
        <label className="font-meta text-xs text-muted-foreground block mb-1">Type</label>
        <select
          name="type"
          className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30"
        >
          <option value="percent">Percent</option>
          <option value="fixed">Fixed $</option>
        </select>
      </div>
      <div>
        <label className="font-meta text-xs text-muted-foreground block mb-1">Amount</label>
        <input
          name="amount"
          type="number"
          required
          min="1"
          step="any"
          placeholder="20"
          className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30"
        />
      </div>
      <div>
        <label className="font-meta text-xs text-muted-foreground block mb-1">Usage limit</label>
        <input
          name="usageLimit"
          type="number"
          min="1"
          placeholder="Unlimited"
          className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30"
        />
      </div>
      <div>
        <label className="font-meta text-xs text-muted-foreground block mb-1">Expires</label>
        <input
          name="expiresAt"
          type="date"
          className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30"
        />
      </div>
      <div className="flex flex-col justify-end gap-1.5">
        {state?.error && (
          <p className="font-meta text-xs text-rose-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-ink text-cream font-meta text-xs px-4 py-2 rounded-sm hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create code"}
        </button>
      </div>
    </form>
  );
}
