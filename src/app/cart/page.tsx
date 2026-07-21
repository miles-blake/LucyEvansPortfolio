"use client";

import { useCart } from "@/lib/cart-store";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useState } from "react";

export default function CartPage() {
  const { items, remove, total, count } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (count() === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <ShoppingBag size={40} className="text-muted-foreground mx-auto mb-6" />
        <h1 className="font-display text-3xl text-ink mb-4">Your cart is empty.</h1>
        <p className="text-muted-foreground mb-8">Browse the gallery to find prints you love.</p>
        <Link href="/gallery">
          <Button>Browse gallery</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-4xl text-ink mb-12">Cart.</h1>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 border-b border-border pb-6"
            >
              {/* Placeholder thumbnail — real image would need a lookup */}
              <div className="w-20 h-24 bg-muted flex-shrink-0 rounded-sm overflow-hidden relative">
                <Image
                  src={`https://picsum.photos/seed/${item.id}/160/200`}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg text-ink mb-1 truncate">{item.title}</p>
                <p className="font-meta text-muted-foreground text-sm mb-1">
                  {item.type === "bundle" ? "Bundle" : "Digital print"}
                </p>
                <p className="font-meta text-muted-foreground text-sm">Personal use license</p>
              </div>
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                <span className="font-display text-xl text-ink">
                  ${(item.price / 100).toFixed(0)}
                </span>
                <button
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.title}`}
                  className="text-muted-foreground hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-muted rounded-sm p-6 space-y-4 sticky top-24">
            <h2 className="font-display text-xl text-ink">Order summary</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate mr-2">{item.title}</span>
                  <span className="text-ink flex-shrink-0">${(item.price / 100).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 flex justify-between">
              <span className="font-display text-lg text-ink">Total</span>
              <span className="font-display text-lg text-ink">${(total() / 100).toFixed(2)}</span>
            </div>
            <p className="font-meta text-muted-foreground text-xs">
              Digital downloads only — no physical shipping. Delivered instantly after purchase.
            </p>
            {error && (
              <p className="font-meta text-destructive text-sm">{error}</p>
            )}
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Redirecting…" : (
                <span className="inline-flex items-center gap-2">
                  Checkout <ArrowRight size={16} />
                </span>
              )}
            </Button>
            <p className="font-meta text-muted-foreground text-xs text-center">
              Powered by Stripe · Secure checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
