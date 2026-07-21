"use client";

import { useState } from "react";
import { sendAdminEmail } from "@/app/admin/email/actions";

interface Props {
  defaultTo?: string;
  defaultSubject?: string;
}

const inputCls = "w-full text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky/40";

export function EmailComposeForm({ defaultTo, defaultSubject }: Props) {
  const [to, setTo] = useState(defaultTo ?? "");
  const [subject, setSubject] = useState(defaultSubject ?? "");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    const result = await sendAdminEmail({ to, subject, body });
    if (result.error) {
      setStatus("error");
      setErrorMsg(result.error);
    } else {
      setStatus("sent");
      setBody("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="font-meta text-xs text-muted-foreground block mb-1">To</label>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          required
          placeholder="recipient@example.com"
          className={inputCls}
        />
      </div>
      <div>
        <label className="font-meta text-xs text-muted-foreground block mb-1">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          placeholder="Subject line"
          className={inputCls}
        />
      </div>
      <div>
        <label className="font-meta text-xs text-muted-foreground block mb-1">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={8}
          placeholder="Write your message…"
          className={`${inputCls} resize-none`}
        />
      </div>

      {status === "sent" && (
        <p className="font-meta text-xs text-sage">Sent!</p>
      )}
      {status === "error" && (
        <p className="font-meta text-xs text-rose">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-ink text-cream px-3 py-1.5 rounded-sm text-xs font-meta hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send email"}
      </button>
    </form>
  );
}
