"use client";

import { useState } from "react";
import { Download, Share } from "lucide-react";

interface Props {
  href: string;
  filename: string;
  label?: string;
}

export default function DownloadButton({ href, filename, label = "Download" }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  // Web Share API with file support — available on iOS Safari 15+ and Android Chrome.
  // When supported we fetch the image as a blob and invoke the native share sheet,
  // which lets the user tap "Save to Photos" directly.
  const canShare = typeof navigator !== "undefined" && !!navigator.canShare;

  async function handleShare() {
    setStatus("loading");
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        setStatus("done");
      } else {
        // canShare returned false for files — fall back to anchor download
        triggerAnchorDownload();
      }
    } catch (err) {
      // User cancelled the share sheet — that's fine, don't show error
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setStatus("error");
    }
  }

  function triggerAnchorDownload() {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
    setStatus("done");
  }

  if (canShare) {
    return (
      <button
        onClick={handleShare}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-ink/80 transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-ring shrink-0 disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
            Preparing…
          </>
        ) : (
          <>
            <Share size={14} />
            {status === "done" ? "Shared!" : label}
          </>
        )}
      </button>
    );
  }

  // Desktop: plain anchor with download attribute
  return (
    <a
      href={href}
      download={filename}
      className="inline-flex items-center gap-2 bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-ink/80 transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-ring shrink-0"
    >
      <Download size={14} /> {label}
    </a>
  );
}
