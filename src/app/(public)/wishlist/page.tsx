import { WishlistView } from "@/components/wishlist/WishlistView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-3xl text-ink mb-8">Saved photos</h1>
      <WishlistView />
    </div>
  );
}
