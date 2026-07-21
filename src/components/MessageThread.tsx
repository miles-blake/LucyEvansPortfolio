"use client";

import { useActionState } from "react";

interface Message {
  id: string;
  senderRole: string;
  body: string;
  createdAt: Date;
}

type SendAction = (prev: unknown, formData: FormData) => Promise<void>;

export function MessageThread({
  messages,
  sendAction,
  hiddenFields,
  viewerRole,
}: {
  messages: Message[];
  sendAction: SendAction;
  hiddenFields: Record<string, string>;
  viewerRole: "admin" | "client";
}) {
  const [, formAction, pending] = useActionState(sendAction as (prev: unknown, fd: FormData) => Promise<unknown>, undefined);

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <p className="font-meta text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => {
            const isOwn = m.senderRole === viewerRole;
            return (
              <li key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-sm px-4 py-3 text-sm ${
                  isOwn ? "bg-ink text-cream" : "bg-white border border-border text-ink"
                }`}>
                  <p>{m.body}</p>
                  <p className={`font-meta text-[11px] mt-1.5 ${isOwn ? "text-cream/60" : "text-muted-foreground"}`}>
                    {m.senderRole === "admin" ? "Lucy" : "You"} ·{" "}
                    {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                    {new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form action={formAction} className="flex gap-2 pt-2 border-t border-border">
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input
          name="body"
          type="text"
          required
          placeholder="Write a message…"
          className="flex-1 border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ink/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream font-meta text-xs px-4 py-2 rounded-sm hover:opacity-80 transition-opacity disabled:opacity-50 whitespace-nowrap"
        >
          {pending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
