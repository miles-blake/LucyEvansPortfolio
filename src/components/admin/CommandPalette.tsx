"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

type Result = {
  type: "booking" | "order" | "photo" | "inquiry";
  id: string;
  label: string;
  sub: string;
  href: string;
};

const TYPE_COLORS: Record<Result["type"], string> = {
  booking: "bg-sky/20 text-sky",
  order: "bg-sage/20 text-sage",
  photo: "bg-ink/10 text-ink",
  inquiry: "bg-blush/30 text-rose",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open on ⌘K or Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery("");
      setResults([]);
      setActiveIdx(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setActiveIdx(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[activeIdx]) { navigate(results[activeIdx].href); }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-hidden />

      <div
        className="relative w-full max-w-lg bg-cream border border-border rounded-sm shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search bookings, orders, photos, inquiries…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted-foreground focus:outline-none"
          />
          {loading && <span className="font-meta text-xs text-muted-foreground">…</span>}
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-ink transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-72 overflow-y-auto divide-y divide-border">
            {results.map((r, i) => (
              <li key={r.id}>
                <button
                  onClick={() => navigate(r.href)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === activeIdx ? "bg-ink/5" : "hover:bg-ink/5"
                  }`}
                >
                  <span className={`font-meta text-[10px] px-1.5 py-0.5 rounded-sm shrink-0 ${TYPE_COLORS[r.type]}`}>
                    {r.type}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-ink truncate">{r.label}</span>
                    <span className="block font-meta text-xs text-muted-foreground truncate">{r.sub}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No results for &ldquo;{query}&rdquo;</p>
        )}

        {query.length === 0 && (
          <p className="px-4 py-4 font-meta text-xs text-muted-foreground text-center">
            Type to search · <kbd className="bg-ink/8 px-1 py-0.5 rounded text-[10px]">↑↓</kbd> navigate · <kbd className="bg-ink/8 px-1 py-0.5 rounded text-[10px]">↵</kbd> open · <kbd className="bg-ink/8 px-1 py-0.5 rounded text-[10px]">esc</kbd> close
          </p>
        )}
      </div>
    </div>
  );
}
