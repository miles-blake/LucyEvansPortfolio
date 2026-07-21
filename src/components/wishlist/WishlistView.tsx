"use client";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/lib/wishlist-store";
import { useCart } from "@/lib/cart-store";
import { useEffect, useState } from "react";

export function WishlistView() {
  const { items, remove } = useWishlist();
  const cart = useCart();
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  // Fetch current prices from DB so stale localStorage prices don't show
  useEffect(() => {
    if (items.length === 0) return;
    const ids = items.map((i) => i.id).join(",");
    fetch(`/api/photos/prices?ids=${ids}`)
      .then((r) => r.json())
      .then((data) => setLivePrices(data))
      .catch(() => {});
  }, [items.length]);

  function priceFor(item: { id: string; price: number }) {
    return livePrices[item.id] ?? item.price;
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">
        No saved photos yet. Browse the gallery and hit the bookmark icon to save photos you love.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const price = priceFor(item);
        return (
          <div key={item.id} className="flex flex-col border border-border rounded-sm overflow-hidden">
            <Link href={`/gallery/${item.slug}`} className="relative aspect-[3/4] block overflow-hidden bg-muted">
              <Image
                src={item.previewImageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 hover:scale-[1.03]"
              />
            </Link>
            <div className="p-3 flex flex-col gap-2 bg-cream flex-1">
              <div>
                <p className="font-meta text-ink text-sm truncate">{item.title}</p>
                <p className="font-meta text-muted-foreground text-xs">${(price / 100).toFixed(0)}</p>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() =>
                    cart.add({ id: item.id, type: "photo", title: item.title, price, imageUrl: item.previewImageUrl })
                  }
                  className="flex-1 text-xs bg-ink text-cream px-2 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta"
                >
                  Add to cart
                </button>
                <button
                  onClick={() => remove(item.id)}
                  className="text-xs text-muted-foreground hover:text-ink transition-colors font-meta"
                  aria-label="Remove from wishlist"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
