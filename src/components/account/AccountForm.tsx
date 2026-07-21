"use client";

import { useActionState } from "react";

type ActionFn = (prev: unknown, formData: FormData) => Promise<{ error: string } | undefined>;

export function AccountForm({
  action,
  submitLabel,
  children,
}: {
  action: ActionFn;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-sm px-3 py-2">
          {state.error}
        </p>
      )}
      {children}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-cream font-meta text-sm py-2.5 rounded-sm hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
