"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function PreviewBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(document.cookie.includes("lep_preview=1"));
  }, []);

  if (!visible) return null;

  function exitPreview() {
    // Clear the cookie client-side and redirect to admin
    document.cookie = "lep_preview=; path=/; max-age=0";
    router.push("/admin");
  }

  return (
    <div className="fixed top-0 inset-x-0 z-[9999] bg-ink text-cream flex items-center justify-between px-4 py-2 text-xs font-meta">
      <span>Admin preview mode — you&apos;re seeing the site as a visitor would.</span>
      <button
        onClick={exitPreview}
        className="border border-cream/30 text-cream px-3 py-1 rounded-sm hover:bg-cream/10 transition-colors"
      >
        Return to admin →
      </button>
    </div>
  );
}
