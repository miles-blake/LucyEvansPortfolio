"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

interface Props {
  collections: string[];
  activeCollection: string | null;
}

export default function GalleryFilter({ collections, activeCollection }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setCollection(col: string | null) {
    const next = new URLSearchParams(params.toString());
    if (col) {
      next.set("collection", col);
    } else {
      next.delete("collection");
    }
    startTransition(() => {
      router.push(`/gallery?${next.toString()}`, { scroll: false });
    });
  }

  const all = ["All", ...collections];

  return (
    <div
      className={cn("flex flex-wrap gap-2", isPending && "opacity-60 pointer-events-none")}
      role="group"
      aria-label="Filter by collection"
    >
      {all.map((col) => {
        const isActive = col === "All" ? !activeCollection : activeCollection === col;
        return (
          <button
            key={col}
            onClick={() => setCollection(col === "All" ? null : col)}
            className={cn(
              "font-meta px-3 py-1.5 border transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              isActive
                ? "border-sky bg-sky/10 text-ink"
                : "border-border text-muted-foreground hover:border-sky/50 hover:text-ink"
            )}
          >
            {col}
          </button>
        );
      })}
    </div>
  );
}
