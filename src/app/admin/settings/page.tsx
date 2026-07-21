import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { WatermarkForm } from "./WatermarkForm";
import Link from "next/link";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "main" } }) ?? {
    watermarkText: "© Lucy Evans",
    watermarkOpacity: 60,
    watermarkPosition: "south_east",
    watermarkFontSize: 24,
  };

  return (
    <div className="max-w-2xl space-y-10">
      <h1 className="font-display text-2xl text-ink">Settings</h1>

      <section className="border border-border rounded-sm p-6">
        <h2 className="font-display text-lg text-ink mb-1">Photo watermark</h2>
        <p className="font-meta text-xs text-muted-foreground mb-6">
          These settings apply to all watermarked preview images in the shop.
        </p>
        <WatermarkForm settings={settings} />
      </section>

      <section className="border border-border rounded-sm p-6">
        <h2 className="font-display text-lg text-ink mb-1">Activity log</h2>
        <p className="font-meta text-xs text-muted-foreground mb-4">
          A record of all admin actions — status changes, deletions, and payments.
        </p>
        <Link
          href="/admin/audit"
          className="font-meta text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity inline-block"
        >
          View activity log →
        </Link>
      </section>
    </div>
  );
}
