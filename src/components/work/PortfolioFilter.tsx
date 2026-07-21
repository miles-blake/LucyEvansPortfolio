"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

interface Props {
  allTags: string[];
  activeTag: string | null;
}

export default function PortfolioFilter({ allTags, activeTag }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setTag(tag: string | null) {
    const next = new URLSearchParams(params.toString());
    if (tag) {
      next.set("tag", tag);
    } else {
      next.delete("tag");
    }
    startTransition(() => {
      router.push(`/work?${next.toString()}`, { scroll: false });
    });
  }

  const tags = ["All", ...allTags];

  return (
    <div
      className={cn("flex flex-wrap gap-2", isPending && "opacity-60 pointer-events-none")}
      role="group"
      aria-label="Filter by tag"
    >
      {tags.map((tag) => {
        const isActive = tag === "All" ? !activeTag : activeTag === tag;
        return (
          <button
            key={tag}
            onClick={() => setTag(tag === "All" ? null : tag)}
            className={cn(
              "font-meta px-3 py-1.5 border transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              isActive
                ? "border-rose bg-rose/10 text-ink"
                : "border-border text-muted-foreground hover:border-rose/50 hover:text-ink"
            )}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
