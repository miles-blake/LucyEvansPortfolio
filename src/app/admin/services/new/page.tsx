import { createService } from "../actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — New Service Package" };

const cls = "w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm";

export default function NewServicePage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/services" className="text-sm text-muted-foreground hover:text-ink">← Services</Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-display text-xl text-ink">New package</h1>
      </div>
      <ServiceForm action={createService} submitLabel="Create package" />
    </div>
  );
}

export function ServiceForm({
  action,
  submitLabel,
  pkg,
}: {
  action: (fd: FormData) => Promise<void>;
  submitLabel: string;
  pkg?: {
    id: string;
    name: string;
    description: string | null;
    rollsIncluded: number;
    photosIncluded: number;
    hoursIncluded: number | null;
    basePrice: number;
    eventTypes: string[];
    addOnPricing: unknown;
  };
}) {
  const addOns = (pkg?.addOnPricing ?? {}) as Record<string, number>;

  return (
    <form action={action} className="space-y-5">
      {pkg && <input type="hidden" name="id" value={pkg.id} />}

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Name *</label>
        <input type="text" name="name" defaultValue={pkg?.name} required className={cls} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Description</label>
        <textarea rows={3} name="description" defaultValue={pkg?.description ?? ""} className={`${cls} resize-none`} />
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-1.5">Rolls *</label>
          <input type="number" min="1" name="rollsIncluded" defaultValue={pkg?.rollsIncluded} required className={cls} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1.5">Photos *</label>
          <input type="number" min="1" name="photosIncluded" defaultValue={pkg?.photosIncluded} required className={cls} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1.5">Hours</label>
          <input type="number" min="1" max="24" name="hoursIncluded" defaultValue={pkg?.hoursIncluded ?? ""} placeholder="—" className={cls} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1.5">Base price (USD) *</label>
          <input type="number" step="0.01" min="0" name="priceDisplay" defaultValue={pkg ? (pkg.basePrice / 100).toFixed(2) : ""} required className={cls} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Event types (comma-separated) *</label>
        <input type="text" name="eventTypes" defaultValue={pkg?.eventTypes.join(", ")} placeholder="portrait, wedding, elopement" required className={cls} />
      </div>

      <fieldset className="border border-border rounded-sm p-4">
        <legend className="text-sm text-muted-foreground px-1">Add-on pricing (0 = not available)</legend>
        <div className="grid sm:grid-cols-3 gap-4 mt-2">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Extra roll (USD)</label>
            <input type="number" step="0.01" min="0" name="extraRollPriceDisplay" defaultValue={((addOns.extraRollPrice ?? 0) / 100).toFixed(2)} className={cls} />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Rush delivery (USD)</label>
            <input type="number" step="0.01" min="0" name="rushDeliveryPriceDisplay" defaultValue={((addOns.rushDeliveryPrice ?? 0) / 100).toFixed(2)} className={cls} />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Second shooter (USD)</label>
            <input type="number" step="0.01" min="0" name="secondShooterPriceDisplay" defaultValue={((addOns.secondShooterPrice ?? 0) / 100).toFixed(2)} className={cls} />
          </div>
        </div>
      </fieldset>

      <button type="submit" className="bg-ink text-cream text-sm px-5 py-2.5 rounded-sm hover:opacity-80 transition-opacity">
        {submitLabel}
      </button>
    </form>
  );
}
