"use client";

import { useState } from "react";

interface Slot {
  id: string;
  label: string;
  startTime: string;
}

interface Props {
  dayId: string;
  dayTitle: string;
  slots: Slot[];
  price: number;
  duration: number;
}

const inputCls = "w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30 placeholder:text-muted-foreground";
const labelCls = "font-meta text-xs text-muted-foreground block mb-1";

export function MiniSessionBookingForm({ dayId, dayTitle, slots, price, duration }: Props) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [step, setStep] = useState<"slots" | "details">("slots");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const dollars = (price / 100).toFixed(0);

  async function handleCheckout() {
    if (!selectedSlotId || !name.trim() || !email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mini-sessions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlotId, name: name.trim(), email: email.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Slot picker */}
      <section className="border border-border rounded-sm p-6">
        <h2 className="font-display text-lg text-ink mb-4">Choose your time</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => { setSelectedSlotId(slot.id); setStep("details"); }}
              className={`border rounded-sm px-3 py-2.5 text-sm text-center transition-colors font-meta ${
                selectedSlotId === slot.id
                  ? "border-ink bg-ink text-cream"
                  : "border-border text-ink hover:border-ink/40"
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </section>

      {/* Details form */}
      {step === "details" && selectedSlot && (
        <section className="border border-border rounded-sm p-6 space-y-4">
          <h2 className="font-display text-lg text-ink">Your details</h2>
          <div className="p-3 bg-ink/5 rounded-sm">
            <p className="font-meta text-xs text-muted-foreground">Selected slot</p>
            <p className="text-sm text-ink mt-0.5">{selectedSlot.label} · {duration} min · ${dollars}</p>
          </div>
          <div>
            <label className={labelCls}>Full name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputCls}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputCls}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
              placeholder="Optional"
            />
          </div>

          {error && <p className="font-meta text-xs text-rose">{error}</p>}

          <button
            onClick={handleCheckout}
            disabled={loading || !name.trim() || !email.trim()}
            className="w-full bg-ink text-cream py-3 rounded-sm text-sm font-meta hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? "Redirecting to checkout…" : `Pay $${dollars} →`}
          </button>
          <p className="font-meta text-xs text-muted-foreground text-center">
            Your slot is reserved for 30 minutes during checkout.
          </p>
        </section>
      )}
    </div>
  );
}
