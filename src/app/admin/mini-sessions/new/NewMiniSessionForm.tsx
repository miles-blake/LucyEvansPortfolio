"use client";

import { useState, useTransition } from "react";

const inputCls = "w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30";
const labelCls = "font-meta text-xs text-muted-foreground block mb-1";

interface Props {
  createAction: (formData: FormData) => Promise<void>;
}

export function NewMiniSessionForm({ createAction }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [generateDate, setGenerateDate] = useState("");
  const [generateStart, setGenerateStart] = useState("09:00");
  const [generateCount, setGenerateCount] = useState(6);
  const [generateGap, setGenerateGap] = useState(30);

  function generateSlots() {
    if (!generateDate) return;
    const newSlots: string[] = [];
    const [startH, startM] = generateStart.split(":").map(Number);
    let totalMinutes = startH * 60 + startM;
    for (let i = 0; i < generateCount; i++) {
      const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
      const m = (totalMinutes % 60).toString().padStart(2, "0");
      newSlots.push(`${generateDate}T${h}:${m}`);
      totalMinutes += generateGap;
    }
    setSlots((prev) => {
      const combined = [...prev, ...newSlots];
      return Array.from(new Set(combined)).sort();
    });
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function addManualSlot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const val = fd.get("manualSlot") as string;
    if (val && !slots.includes(val)) {
      setSlots((prev) => [...prev, val].sort());
      (e.currentTarget.elements.namedItem("manualSlot") as HTMLInputElement).value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (slots.length === 0) {
      setError("Add at least one time slot.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set("slots", JSON.stringify(slots));
    startTransition(async () => {
      try {
        await createAction(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function formatSlotDisplay(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Day details */}
      <section className="border border-border rounded-sm p-6 space-y-4">
        <h2 className="font-display text-lg text-ink">Day details</h2>
        <div>
          <label className={labelCls}>Title *</label>
          <input name="title" required className={inputCls} placeholder="e.g. Spring Mini Sessions — Golden Hour" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Date *</label>
            <input name="date" type="date" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input name="location" className={inputCls} placeholder="e.g. Griffith Park, Los Angeles" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea name="description" rows={3} className={inputCls} placeholder="What clients should know about this event…" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Minutes per slot *</label>
            <input name="duration" type="number" required min="5" max="120" defaultValue="30" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Price per slot ($) *</label>
            <input name="price" type="number" required min="0" step="0.01" className={inputCls} placeholder="150" />
          </div>
        </div>
      </section>

      {/* Time slot generator */}
      <section className="border border-border rounded-sm p-6 space-y-4">
        <h2 className="font-display text-lg text-ink">Time slots</h2>

        <div className="bg-ink/5 rounded-sm p-4 space-y-3">
          <p className="font-meta text-xs text-muted-foreground uppercase tracking-wide">Generate slots automatically</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={generateDate} onChange={(e) => setGenerateDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>First slot at</label>
              <input type="time" value={generateStart} onChange={(e) => setGenerateStart(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Number of slots</label>
              <input type="number" value={generateCount} onChange={(e) => setGenerateCount(parseInt(e.target.value))} min="1" max="20" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Gap (minutes)</label>
              <input type="number" value={generateGap} onChange={(e) => setGenerateGap(parseInt(e.target.value))} min="5" max="120" className={inputCls} />
            </div>
          </div>
          <button
            type="button"
            onClick={generateSlots}
            disabled={!generateDate}
            className="text-xs border border-border text-ink px-3 py-1.5 rounded-sm hover:bg-ink hover:text-cream transition-colors font-meta disabled:opacity-40"
          >
            Generate {generateCount} slots
          </button>
        </div>

        <div>
          <p className="font-meta text-xs text-muted-foreground mb-2">Or add a single slot manually:</p>
          <form onSubmit={addManualSlot} className="flex gap-2">
            <input name="manualSlot" type="datetime-local" className={`${inputCls} flex-1`} />
            <button type="submit" className="text-xs border border-border text-muted-foreground px-3 py-1.5 rounded-sm hover:text-ink transition-colors font-meta whitespace-nowrap">
              + Add
            </button>
          </form>
        </div>

        {slots.length > 0 ? (
          <ul className="space-y-1.5">
            {slots.map((slot, i) => (
              <li key={slot} className="flex items-center justify-between border border-border rounded-sm px-3 py-2 text-sm">
                <span className="text-ink">{formatSlotDisplay(slot)}</span>
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="text-muted-foreground hover:text-rose transition-colors text-lg leading-none"
                  aria-label="Remove slot"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-meta text-xs text-muted-foreground">No slots added yet.</p>
        )}
      </section>

      {error && <p className="font-meta text-xs text-rose">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="bg-ink text-cream px-4 py-2 rounded-sm text-sm font-meta hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create mini session day"}
      </button>
    </form>
  );
}
