"use client";

import { useState, useRef } from "react";

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressInput({ value, onChange, placeholder, className }: Props) {
  const [results, setResults] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    onChange(q);
    clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.predictions ?? []);
        setOpen((data.predictions ?? []).length > 0);
      } catch { /* silent — user can still type freely */ }
    }, 300);
  }

  function handleSelect(p: Prediction) {
    onChange(p.description);
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
          {results.map((p) => (
            <li
              key={p.place_id}
              onMouseDown={() => handleSelect(p)}
              className="px-3 py-2.5 cursor-pointer hover:bg-ink/5 border-b border-border/50 last:border-0"
            >
              <p className="text-sm text-ink">{p.structured_formatting.main_text}</p>
              {p.structured_formatting.secondary_text && (
                <p className="text-xs text-muted-foreground mt-0.5">{p.structured_formatting.secondary_text}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
