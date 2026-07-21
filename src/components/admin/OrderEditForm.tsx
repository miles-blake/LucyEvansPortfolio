"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { saveOrder } from "@/app/admin/orders/actions";

interface Photo {
  id: string;
  title: string;
  price: number;
}

interface Bundle {
  id: string;
  title: string;
  price: number;
}

interface OrderItemData {
  id?: string;
  photoId?: string;
  bundleId?: string;
  price: number;
  label: string;
  previewImageUrl?: string;
}

interface OrderInput {
  id: string;
  customerEmail: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  items: Array<{
    id: string;
    photoId?: string | null;
    bundleId?: string | null;
    price: number;
    photo?: { title: string; price: number; previewImageUrl: string } | null;
    bundle?: { title: string; price: number } | null;
  }>;
}

interface Props {
  order: OrderInput;
  photos: Photo[];
  bundles: Bundle[];
}

const STATUS_OPTIONS = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

export function OrderEditForm({ order, photos, bundles }: Props) {
  const router = useRouter();

  const [customerEmail, setCustomerEmail] = useState(order.customerEmail);
  const [status, setStatus] = useState<"PENDING" | "PAID" | "FAILED" | "REFUNDED">(order.status);
  const [items, setItems] = useState<OrderItemData[]>(
    order.items.map((item) => ({
      id: item.id,
      photoId: item.photoId ?? undefined,
      bundleId: item.bundleId ?? undefined,
      price: item.price,
      label: item.photo?.title ?? item.bundle?.title ?? "—",
      previewImageUrl: item.photo?.previewImageUrl,
    }))
  );

  const [addSelectValue, setAddSelectValue] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateItemPrice(index: number, dollars: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, price: Math.round(parseFloat(dollars || "0") * 100) } : item
      )
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    if (!addSelectValue) return;
    const [type, id] = addSelectValue.split(":");
    if (type === "photo") {
      const photo = photos.find((p) => p.id === id);
      if (!photo) return;
      setItems((prev) => [
        ...prev,
        { photoId: photo.id, price: photo.price, label: photo.title },
      ]);
    } else if (type === "bundle") {
      const bundle = bundles.find((b) => b.id === id);
      if (!bundle) return;
      setItems((prev) => [
        ...prev,
        { bundleId: bundle.id, price: bundle.price, label: bundle.title },
      ]);
    }
    setAddSelectValue("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSubmitting(true);
    try {
      const result = await saveOrder({
        orderId: order.id,
        customerEmail: customerEmail.trim(),
        status,
        items: items.map((item) => ({
          id: item.id,
          photoId: item.photoId,
          bundleId: item.bundleId,
          price: item.price,
        })),
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer */}
      <section className="border border-border rounded-sm p-6">
        <h2 className="font-display text-lg text-ink mb-4">Customer</h2>
        <div>
          <label className="font-meta text-xs text-muted-foreground block mb-1">Email</label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            className="w-full text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-sky/40"
          />
        </div>
      </section>

      {/* Status */}
      <section className="border border-border rounded-sm p-6">
        <h2 className="font-display text-lg text-ink mb-4">Status</h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-sky/40"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.toLowerCase()}</option>
          ))}
        </select>
      </section>

      {/* Items */}
      <section className="border border-border rounded-sm p-6">
        <h2 className="font-display text-lg text-ink mb-4">Items</h2>

        <div className="space-y-3 mb-4">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">No items.</p>
          )}
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-3 border border-border rounded-sm p-3">
              {/* Thumbnail */}
              <div className="w-14 h-14 shrink-0 rounded-sm overflow-hidden bg-muted relative">
                {item.previewImageUrl ? (
                  <Image
                    src={item.previewImageUrl}
                    alt={item.label}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-sage/10 flex items-center justify-center">
                    <span className="font-meta text-[9px] text-muted-foreground text-center px-1">Bundle</span>
                  </div>
                )}
              </div>

              {/* Info + controls */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink truncate mb-1.5">{item.label}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <label className="font-meta text-[10px] text-muted-foreground">Price</label>
                  <div className="relative w-20">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                    <input
                      type="number"
                      value={(item.price / 100).toFixed(2)}
                      onChange={(e) => updateItemPrice(index, e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full text-xs border border-border rounded-sm pl-5 pr-2 py-1 bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-sky/40"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-muted-foreground hover:text-rose transition-colors text-lg leading-none shrink-0 pb-0.5"
                aria-label="Remove item"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add item */}
        {(photos.length > 0 || bundles.length > 0) && (
          <div className="flex items-center gap-2">
            <select
              value={addSelectValue}
              onChange={(e) => setAddSelectValue(e.target.value)}
              className="flex-1 text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-sky/40"
            >
              <option value="">Select a product…</option>
              {photos.length > 0 && (
                <optgroup label="Photos">
                  {photos.map((p) => (
                    <option key={p.id} value={`photo:${p.id}`}>
                      {p.title} — ${(p.price / 100).toFixed(0)}
                    </option>
                  ))}
                </optgroup>
              )}
              {bundles.length > 0 && (
                <optgroup label="Bundles">
                  {bundles.map((b) => (
                    <option key={b.id} value={`bundle:${b.id}`}>
                      {b.title} — ${(b.price / 100).toFixed(0)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <button
              type="button"
              onClick={addItem}
              disabled={!addSelectValue}
              className="border border-border text-muted-foreground px-3 py-1.5 rounded-sm text-xs font-meta hover:text-ink transition-colors disabled:opacity-40"
            >
              + Add
            </button>
          </div>
        )}
      </section>

      {error && <p className="font-meta text-xs text-rose">{error}</p>}
      {saved && <p className="font-meta text-xs text-sage">Order saved.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-ink text-cream px-3 py-1.5 rounded-sm text-xs font-meta hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save order"}
      </button>
    </form>
  );
}
