"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="max-w-sm text-center">
        <p className="font-meta text-xs text-muted-foreground uppercase tracking-widest mb-3">Admin error</p>
        <h1 className="font-display text-2xl text-ink mb-3">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || "An unexpected error occurred loading this page."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="font-meta text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="font-meta text-xs text-muted-foreground hover:text-ink transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
