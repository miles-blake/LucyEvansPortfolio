"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Check } from "lucide-react";

interface Props {
  photoId: string;
  title: string;
  price: number;
  disabled?: boolean;
}

export default function AddToCartButton({ photoId, title, price, disabled }: Props) {
  const { add, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = items.some((i) => i.id === photoId);

  function handleClick() {
    if (inCart || disabled) return;
    add({ id: photoId, type: "photo", title, price });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  if (disabled) {
    return (
      <Button disabled className="w-full" size="lg">
        Sold out
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleClick}
        className="w-full"
        size="lg"
        variant={inCart ? "outline" : "default"}
      >
        {inCart ? (
          <span className="inline-flex items-center gap-2">
            <Check size={16} /> In cart
          </span>
        ) : justAdded ? (
          <span className="inline-flex items-center gap-2">
            <Check size={16} /> Added!
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <ShoppingBag size={16} /> Add to cart — ${(price / 100).toFixed(0)}
          </span>
        )}
      </Button>
      {inCart && (
        <p className="text-center">
          <a href="/cart" className="font-meta text-sm text-muted-foreground hover:text-ink transition-colors underline underline-offset-2">
            View cart & checkout
          </a>
        </p>
      )}
    </div>
  );
}
