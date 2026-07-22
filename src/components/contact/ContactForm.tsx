"use client";

import { useState } from "react";

const inputClass =
  "w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm";

const REASONS = [
  "Questions about a package",
  "Pricing inquiry",
  "Ready to book",
  "General question",
  "Other",
];

interface Package {
  id: string;
  name: string;
}

interface Props {
  packages: Package[];
  prefill?: {
    name: string;
    email: string;
  };
}

export default function ContactForm({ packages, prefill }: Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const get = (n: string) =>
      (form.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)?.value ?? "";

    const data = {
      name: get("name"),
      email: get("email"),
      phone: get("phone") || null,
      packageInterest: get("packageInterest") || null,
      reason: get("reason") || null,
      commPref: get("commPref"),
      subject: get("reason") || "General inquiry",
      message: get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-border rounded-sm p-8 text-center">
        <p className="font-display text-2xl text-ink mb-3">Message received.</p>
        <p className="text-muted-foreground">
          Thanks for reaching out — I&apos;ll be in touch soon.
        </p>
      </div>
    );
  }

  const hasPhone = phone.replace(/\D/g, "").length >= 10;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name + Email */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block font-meta text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
            Name *
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={prefill?.name ?? ""}
            className={inputClass}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block font-meta text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
            Email *
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={prefill?.email ?? ""}
            className={inputClass}
            placeholder="your@email.com"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block font-meta text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
          Phone
        </label>
        <input
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          placeholder="(801) 555-0100"
        />
      </div>

      {/* Package interest + Reason */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block font-meta text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
            Package interest
          </label>
          <select name="packageInterest" className={inputClass}>
            <option value="">Not sure yet</option>
            {packages.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-meta text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
            Reason for reaching out
          </label>
          <select name="reason" className={inputClass}>
            <option value="">Select one…</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Communication preference */}
      <div>
        <p className="font-meta text-xs text-muted-foreground uppercase tracking-wide mb-2">
          Preferred communication
        </p>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="commPref" value="email" defaultChecked className="accent-ink" />
            <span className="text-sm text-ink">Email</span>
          </label>
          <label className={`flex items-center gap-2 ${!hasPhone ? "opacity-40" : "cursor-pointer"}`}>
            <input type="radio" name="commPref" value="sms" disabled={!hasPhone} className="accent-ink" />
            <span className="text-sm text-ink">Text</span>
            {!hasPhone && (
              <span className="font-meta text-xs text-muted-foreground">(enter phone first)</span>
            )}
          </label>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block font-meta text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
          Message *
        </label>
        <textarea
          name="message"
          rows={5}
          required
          className={inputClass}
          placeholder="Tell me more — what questions do you have, what are you looking for, anything else I should know?"
        />
      </div>

      {status === "error" && <p className="text-sm text-rose">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-ink text-cream text-sm px-5 py-2.5 rounded-sm hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
