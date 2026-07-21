"use client";

import { useState, useRef } from "react";

interface NominatimResult {
  place_id: number;
  display_name: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressInput({ value, onChange, placeholder, className }: Props) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    onChange(q);
    clearTimeout(timer.current);
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
          { headers: { "Accept-Language": "en-US,en" } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch { /* network errors are silent — user can still type freely */ }
    }, 350);
  }

  function handleSelect(result: NominatimResult) {
    // Trim the long country/county suffix Nominatim adds
    const parts = result.display_name.split(", ");
    const trimmed = parts.slice(0, Math.min(parts.length, 5)).join(", ");
    onChange(trimmed);
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && (
        <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-cream border border-border rounded-sm shadow-md max-h-52 overflow-y-auto">
          {results.map((r) => {
            const parts = r.display_name.split(", ");
            const name = parts[0];
            const sub = parts.slice(1, 4).join(", ");
            return (
              <li
                key={r.place_id}
                onMouseDown={() => handleSelect(r)}
                className="px-3 py-2.5 cursor-pointer hover:bg-ink/5 border-b border-border/50 last:border-0"
              >
                <p className="text-sm text-ink">{name}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
