import { prisma } from "@/lib/prisma";
import { saveContractTemplate } from "./actions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Contract Template",
};

const MERGE_VARS = [
  "{{clientName}}",
  "{{clientEmail}}",
  "{{clientPhone}}",
  "{{eventDate}}",
  "{{eventType}}",
  "{{packageName}}",
  "{{totalPrice}}",
  "{{depositAmount}}",
  "{{bookingDate}}",
];

export default async function ContractTemplatePage() {
  const template = await prisma.contractTemplate.findFirst();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink">Contract template</h1>
        <p className="font-meta text-sm text-muted-foreground mt-1">
          Write your standard photography contract once — Lucy can generate a personalized PDF for any booking.
        </p>
      </div>

      <form action={saveContractTemplate} className="space-y-4">
        <div>
          <label className="font-meta text-xs text-muted-foreground block mb-1.5">
            Contract body
          </label>
          <textarea
            name="body"
            rows={30}
            defaultValue={template?.body ?? ""}
            placeholder="Type your contract here. Use merge variables like {{clientName}} to personalize each PDF…"
            className="w-full text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30 font-mono resize-y"
          />
        </div>

        {/* Merge variable reference */}
        <div className="border border-border rounded-sm p-4 bg-ink/[0.02]">
          <p className="font-meta text-xs text-muted-foreground mb-2 uppercase tracking-widest">Available merge variables</p>
          <div className="flex flex-wrap gap-2">
            {MERGE_VARS.map((v) => (
              <code
                key={v}
                className="font-mono text-[11px] bg-cream border border-border rounded-sm px-1.5 py-0.5 text-ink"
              >
                {v}
              </code>
            ))}
          </div>
          <p className="font-meta text-[11px] text-muted-foreground mt-2">
            Dates are formatted as "Month DD, YYYY". Prices are formatted as "$X.XX". Separate paragraphs with a blank line.
          </p>
        </div>

        <button
          type="submit"
          className="text-xs bg-ink text-cream px-4 py-2 rounded-sm hover:opacity-80 transition-opacity font-meta"
        >
          Save template
        </button>
      </form>
    </div>
  );
}
