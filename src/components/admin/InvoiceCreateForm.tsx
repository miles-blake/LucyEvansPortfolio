"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomInvoice } from "@/app/admin/invoices/actions";

interface Customer {
  name: string;
  email: string;
  phone?: string;
}

interface LineItem {
  description: string;
  amount: string; // dollars, as string for input
}

interface Props {
  customers: Customer[];
}

export function InvoiceCreateForm({ customers }: Props) {
  const router = useRouter();

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", amount: "" }]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleCustomerSearchChange(value: string) {
    setCustomerSearch(value);
    // Try to match against the datalist options: "${name} — ${email}"
    const match = customers.find((c) => `${c.name} — ${c.email}` === value);
    if (match) {
      setCustomerName(match.name);
      setCustomerEmail(match.email);
      setCustomerPhone(match.phone ?? "");
    }
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { description: "", amount: "" }]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedItems = lineItems
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description.trim(),
        amount: Math.round(parseFloat(item.amount || "0") * 100), // dollars → cents
      }));

    if (parsedItems.length === 0) {
      setError("Add at least one line item.");
      return;
    }
    if (!customerName.trim() || !customerEmail.trim()) {
      setError("Customer name and email are required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createCustomInvoice({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        lineItems: parsedItems,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      });

      if (result.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      router.push(`/admin/invoices/${result.invoiceId}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer */}
      <section className="border border-border rounded-sm p-6">
        <h2 className="font-display text-lg text-ink mb-4">Customer</h2>

        <div className="space-y-3">
          <div>
            <label className="font-meta text-xs text-muted-foreground block mb-1">
              Search existing customer
            </label>
            <input
              type="text"
              list="customers-datalist"
              value={customerSearch}
              onChange={(e) => handleCustomerSearchChange(e.target.value)}
              placeholder="Type a name or email…"
              className="w-full text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky/40"
            />
            <datalist id="customers-datalist">
              {customers.map((c) => (
                <option key={c.email} value={`${c.name} — ${c.email}`} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="font-meta text-xs text-muted-foreground block mb-1">
                Name <span className="text-rose">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                placeholder="Full name"
                className="w-full text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky/40"
              />
            </div>
            <div>
              <label className="font-meta text-xs text-muted-foreground block mb-1">
                Email <span className="text-rose">*</span>
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                placeholder="email@example.com"
                className="w-full text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky/40"
              />
            </div>
            <div>
              <label className="font-meta text-xs text-muted-foreground block mb-1">Phone</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky/40"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Line items */}
      <section className="border border-border rounded-sm p-6">
        <h2 className="font-display text-lg text-ink mb-4">Line items</h2>

        <div className="space-y-2 mb-4">
          {lineItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateLineItem(index, "description", e.target.value)}
                placeholder="Description"
                className="flex-1 text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky/40"
              />
              <div className="relative w-32 shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateLineItem(index, "amount", e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full text-sm border border-border rounded-sm pl-6 pr-3 py-2 bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky/40"
                />
              </div>
              <button
                type="button"
                onClick={() => removeLineItem(index)}
                disabled={lineItems.length === 1}
                className="text-muted-foreground hover:text-rose transition-colors disabled:opacity-30 text-lg leading-none px-1"
                aria-label="Remove line item"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLineItem}
          className="border border-border text-muted-foreground px-3 py-1.5 rounded-sm text-xs font-meta hover:text-ink transition-colors"
        >
          + Add line item
        </button>
      </section>

      {/* Due date & notes */}
      <section className="border border-border rounded-sm p-6">
        <h2 className="font-display text-lg text-ink mb-4">Details</h2>

        <div className="space-y-3">
          <div>
            <label className="font-meta text-xs text-muted-foreground block mb-1">
              Due date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-sky/40"
            />
          </div>
          <div>
            <label className="font-meta text-xs text-muted-foreground block mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional notes for the customer…"
              className="w-full text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky/40 resize-none"
            />
          </div>
        </div>
      </section>

      {error && (
        <p className="font-meta text-xs text-rose">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-ink text-cream px-3 py-1.5 rounded-sm text-xs font-meta hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create invoice"}
      </button>
    </form>
  );
}
