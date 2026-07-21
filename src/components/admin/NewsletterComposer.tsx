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
      setBody(""); // clear existing body
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setBody((prev) => prev + decoder.decode(value));
      }
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

  return (
    <div className="space-y-8">
      {/* Composer */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* AI Prompt Panel */}
        <div className="w-full md:w-80 shrink-0 space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              What&apos;s this newsletter about?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="e.g. Fall booking slots are open, new prints in the gallery, thoughts on shooting Velvia 50 in winter..."
              className="w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm resize-none"
            />
          </div>
          <button
            onClick={handleDraft}
            disabled={aiLoading || !prompt.trim()}
            className="bg-sky/20 text-ink text-sm px-4 py-2 rounded-sm hover:bg-sky/30 transition-colors disabled:opacity-50 flex items-center gap-2"
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
          {aiError && <p className="text-xs text-red-600">{aiError}</p>}
          <p className="text-xs text-muted-foreground">AI will write in Lucy&apos;s voice</p>
        </div>

        {/* Compose Panel */}
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Subject line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm"
              placeholder="Newsletter subject..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              className="w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm resize-none font-mono"
              placeholder="Write your newsletter here, or use AI to draft from the prompt on the left..."
            />
          </div>

          {result && (
            <div className="rounded-sm bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
              Sent to {result.sent} subscriber{result.sent !== 1 ? "s" : ""} successfully.
            </div>
          )}
          {error && (
            <div className="rounded-sm bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
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
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {item.recipientCount ?? "—"}
                    </td>
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
