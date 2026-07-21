"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-meta text-xs text-muted-foreground uppercase tracking-widest mb-4">Something went wrong</p>
        <h1 className="font-display text-3xl text-ink mb-4">Page failed to load</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          An unexpected error occurred. Try refreshing the page.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="font-meta text-sm bg-ink text-cream px-4 py-2 rounded-sm hover:opacity-80 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/"
            className="font-meta text-sm text-muted-foreground hover:text-ink transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
