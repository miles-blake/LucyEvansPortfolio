"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

type Requirement = { label: string; test: (v: string) => boolean };

const REQUIREMENTS: Requirement[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter (A–Z)", test: (v) => /[A-Z]/.test(v) },
  { label: "One number (0–9)", test: (v) => /[0-9]/.test(v) },
];

export function PasswordField() {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const showChecklist = touched && value.length > 0;
  const allMet = REQUIREMENTS.every((r) => r.test(value));

  return (
    <div>
      <label className="font-meta text-xs text-muted-foreground block mb-1">Password</label>
      <input
        name="password"
        type="password"
        required
        autoComplete="new-password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setTouched(true)}
        className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30"
      />

      {showChecklist && (
        <ul className="mt-2 space-y-1">
          {REQUIREMENTS.map((r) => {
            const met = r.test(value);
            return (
              <li key={r.label} className={`flex items-center gap-1.5 font-meta text-[11px] transition-colors ${met ? "text-sage" : "text-rose-500"}`}>
                {met ? <Check size={11} strokeWidth={2.5} /> : <X size={11} strokeWidth={2.5} />}
                {r.label}
              </li>
            );
          })}
        </ul>
      )}

      {!showChecklist && (
        <p className="font-meta text-[11px] text-muted-foreground mt-1">
          8+ characters, one uppercase letter, one number
        </p>
      )}

      {/* Hidden validation input — prevent form submission if requirements not met */}
      {showChecklist && !allMet && (
        <input type="text" required defaultValue="" aria-hidden className="sr-only" tabIndex={-1} />
      )}
    </div>
  );
}
