"use client";
import { Bookmark } from "lucide-react";
import { useWishlist, type WishlistItem } from "@/lib/wishlist-store";

export function SaveButton({ item }: { item: WishlistItem }) {
  const { toggle, has } = useWishlist();
  const saved = has(item.id);
  return (
    <button
      onClick={() => toggle(item)}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={`flex items-center gap-1.5 text-sm transition-colors ${
        saved ? "text-ink" : "text-muted-foreground hover:text-ink"
      }`}
    >
      <Bookmark size={15} className={saved ? "fill-current" : ""} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
