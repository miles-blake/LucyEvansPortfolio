"use client";

import { useActionState, useState } from "react";
import { signContract } from "@/app/account/contract/actions";

type SignAction = typeof signContract;

export function ContractSigner({
  contractId,
  pdfUrl,
  portalToken,
}: {
  contractId: string;
  pdfUrl: string;
  portalToken?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, pending] = useActionState(
    signContract as (prev: unknown, fd: FormData) => Promise<{ error?: string; success?: boolean } | undefined>,
    undefined
  );

  if (state?.success) {
    return (
      <div className="bg-sage/10 border border-sage/30 rounded-sm px-4 py-3">
        <p className="text-sm text-sage font-medium">Contract signed successfully.</p>
        <p className="font-meta text-xs text-muted-foreground mt-1">Your signature has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-meta text-xs border border-border rounded-sm px-3 py-1.5 text-ink hover:opacity-70 transition-opacity"
      >
        View contract PDF →
      </a>

      {!showForm ? (
        <div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-ink text-cream font-meta text-xs px-4 py-2 rounded-sm hover:opacity-80 transition-opacity"
          >
            Sign contract
          </button>
        </div>
      ) : (
        <form action={formAction} className="space-y-3 border border-border rounded-sm p-4">
          <input type="hidden" name="contractId" value={contractId} />
          {portalToken && <input type="hidden" name="portalToken" value={portalToken} />}

          <p className="text-sm text-ink">
            By typing your full name below and clicking &ldquo;I agree&rdquo;, you confirm that you have read and agree to the contract terms.
          </p>

          <div>
            <label className="font-meta text-xs text-muted-foreground block mb-1">Your full name</label>
            <input
              name="signedName"
              type="text"
              required
              placeholder="Full name"
              className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-rose-600">{state.error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="bg-ink text-cream font-meta text-xs px-4 py-2 rounded-sm hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {pending ? "Signing…" : "I agree — sign contract"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="font-meta text-xs text-muted-foreground hover:text-ink transition-colors px-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
