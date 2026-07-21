"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PreviewBanner() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!session?.user?.isTestClient) return null;

  async function exitPreview() {
    setLoading(true);
    await fetch("/api/admin/preview", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="sticky top-0 w-full z-50 bg-ink text-cream flex items-center justify-between px-4 py-2 text-xs font-meta">
      <span>Admin preview mode — you&apos;re seeing the site as a visitor would.</span>
      <button
        onClick={exitPreview}
        disabled={loading}
        className="border border-cream/30 text-cream px-3 py-1 rounded-sm hover:bg-cream/10 transition-colors disabled:opacity-50"
      >
        {loading ? "Returning…" : "Return to admin →"}
      </button>
    </div>
  );
}
