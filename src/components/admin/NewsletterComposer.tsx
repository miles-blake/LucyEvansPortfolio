"use client";

import { useState } from "react";

type NewsletterHistory = {
  id: string;
  subject: string;
  sentAt: Date | null;
  recipientCount: number | null;
};

type Props = {
  history: NewsletterHistory[];
};

export function NewsletterComposer({ history }: Props) {
  const [prompt, setPrompt] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDraft() {
    if (!prompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setSubject("");
    setBody("");

    try {
      const res = await fetch("/api/admin/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok || !res.body) {
        setAiError("Failed to draft.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let subjectParsed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value);

        if (!subjectParsed) {
          // Wait until we have the full first line
          const newlineIdx = buffer.indexOf("\n");
          if (newlineIdx !== -1) {
            const firstLine = buffer.slice(0, newlineIdx).trim();
            if (firstLine.toLowerCase().startsWith("subject:")) {
              setSubject(firstLine.slice("subject:".length).trim());
            }
            // Everything after the first line + blank line goes into body
            const bodyStart = buffer.indexOf("\n\n");
            if (bodyStart !== -1) {
              setBody(buffer.slice(bodyStart + 2));
            }
            subjectParsed = true;
          }
        } else {
          // Keep appending to body
          setBody((prev) => {
            // On first body update after parsing, buffer already seeded it above
            return prev + decoder.decode(value);
          });
        }
      }

      // Final pass: if subject line ended up in body, strip it
      setBody((prev) => {
        const lines = prev.split("\n");
        if (lines[0]?.toLowerCase().startsWith("subject:")) {
          return lines.slice(1).join("\n").trimStart();
        }
        return prev;
      });
    } catch {
      setAiError("Failed to draft. Check your connection.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setResult({ sent: data.sent });
        setSubject("");
        setBody("");
        setPrompt("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const inputCls =
    "w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm";

  return (
    <div className="space-y-8">
      {/* AI prompt row */}
      <div className="flex gap-3 items-start p-4 bg-sky/5 border border-sky/20 rounded-sm">
        <div className="flex-1">
          <label className="block text-sm font-medium text-ink mb-1.5">
            What&apos;s this newsletter about?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="e.g. Fall booking slots are open, new prints in the gallery, thoughts on shooting Velvia 50 in winter..."
            className={`${inputCls} resize-none`}
          />
        </div>
        <div className="pt-6 shrink-0 flex flex-col items-start gap-2">
          <button
            onClick={handleDraft}
            disabled={aiLoading || !prompt.trim()}
            className="bg-sky/20 text-ink text-sm px-4 py-2 rounded-sm hover:bg-sky/30 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {aiLoading ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                Drafting...
              </>
            ) : (
              "Draft with AI"
            )}
          </button>
          <p className="text-xs text-muted-foreground">Writes in Lucy&apos;s voice</p>
        </div>
      </div>
      {aiError && <p className="text-xs text-rose">{aiError}</p>}

      {/* Compose */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Subject line</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputCls}
            placeholder="Newsletter subject..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={`${inputCls} resize-y`}
            style={{ minHeight: "520px" }}
            placeholder="Write your newsletter here, or use AI to draft from the prompt above..."
          />
        </div>

        {result && (
          <div className="rounded-sm bg-sage/10 border border-sage/30 px-4 py-3 text-sm text-ink">
            Sent to {result.sent} subscriber{result.sent !== 1 ? "s" : ""} successfully.
          </div>
        )}
        {error && (
          <div className="rounded-sm bg-rose/10 border border-rose/30 px-4 py-3 text-sm text-rose">
            {error}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending || !subject.trim() || !body.trim()}
          className="bg-ink text-cream text-sm px-5 py-2.5 rounded-sm hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send to all subscribers"}
        </button>
      </div>

      {/* History */}
      <div>
        <h2 className="font-display text-lg text-ink mb-3">Sent newsletters</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No newsletters sent yet.</p>
        ) : (
          <div className="border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-ink/[0.02]">
                  <th className="text-left px-4 py-2.5 font-medium text-ink">Subject</th>
                  <th className="text-left px-4 py-2.5 font-medium text-ink">Recipients</th>
                  <th className="text-left px-4 py-2.5 font-medium text-ink">Date sent</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-ink/[0.02]">
                    <td className="px-4 py-2.5 text-ink">{item.subject}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{item.recipientCount ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {item.sentAt
                        ? new Date(item.sentAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
