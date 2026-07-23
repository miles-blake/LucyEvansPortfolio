export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Film, Camera, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
  description: "Film photography services for weddings, elopements, portraits, and events. Based in Utah County, Utah — available to travel.",
};

export const revalidate = 3600;

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "Wedding",
  elopement: "Elopement",
  portrait: "Portrait",
  event: "Event",
};

const EVENT_TYPE_ORDER = ["portrait", "elopement", "event", "wedding"];

function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export default async function ServicesPage() {
  const packages = await prisma.servicePackage.findMany({
    orderBy: { basePrice: "asc" },
  });

  // Group by primary event type
  const grouped = EVENT_TYPE_ORDER.reduce<Record<string, typeof packages>>(
    (acc, type) => {
      const pkgs = packages.filter((p) => p.eventTypes.includes(type));
      if (pkgs.length) acc[type] = pkgs;
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="mb-16 max-w-2xl">
        <p className="font-meta text-muted-foreground mb-3">Film photography services</p>
        <h1 className="font-display text-4xl md:text-5xl text-ink mb-6">Let&rsquo;s shoot on film.</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Every package includes full-resolution scans, a personal-use license, and delivery within three weeks.
          Based in Utah County, Utah — available to travel anywhere.
        </p>
      </div>

      {/* Process strip */}
      <div className="grid sm:grid-cols-3 gap-6 mb-20 p-6 bg-sage/10 rounded-sm border border-sage/20">
        {[
          { icon: <Camera size={18} />, label: "Shoot", body: "One roll captures 36 frames. I pick the camera, film stock, and moment." },
          { icon: <Film size={18} />, label: "Develop", body: "Film is sent to a pro lab. No digital shortcuts." },
          { icon: <Clock size={18} />, label: "Deliver", body: "High-res scans in 3 weeks. Rush available on most packages." },
        ].map(({ icon, label, body }) => (
          <div key={label} className="flex gap-3">
            <div className="mt-0.5 text-sage">{icon}</div>
            <div>
              <p className="font-display text-ink font-medium mb-1">{label}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Package groups */}
      <div className="space-y-16">
        {Object.entries(grouped).map(([type, pkgs]) => (
          <section key={type}>
            <h2 className="font-display text-2xl text-ink mb-6 capitalize">
              {EVENT_TYPE_LABELS[type] ?? type}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {pkgs.map((pkg) => {
                const addOns = pkg.addOnPricing as Record<string, number> | null;
                const availableAddOns = addOns
                  ? Object.entries(addOns).filter(([, v]) => v > 0)
                  : [];

                return (
                  <div
                    key={pkg.id}
                    className="border border-border rounded-sm p-6 flex flex-col hover:border-sky/40 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-display text-xl text-ink mb-2">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                          {pkg.description}
                        </p>
                      )}

                      {/* Stats row */}
                      <dl className="grid grid-cols-2 gap-3 mb-5">
                        <div>
                          <dt className="font-meta text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Rolls
                          </dt>
                          <dd className="font-display text-ink">{pkg.rollsIncluded}</dd>
                        </div>
                        <div>
                          <dt className="font-meta text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Photos
                          </dt>
                          <dd className="font-display text-ink">{pkg.photosIncluded}+</dd>
                        </div>
                      </dl>

                      {/* Add-ons */}
                      {availableAddOns.length > 0 && (
                        <div className="mb-5">
                          <p className="font-meta text-xs text-muted-foreground uppercase tracking-wider mb-2">
                            Add-ons available
                          </p>
                          <ul className="space-y-1">
                            {availableAddOns.map(([key, price]) => {
                              const labels: Record<string, string> = {
                                extraRollPrice: "Extra roll",
                                rushDeliveryPrice: "Rush delivery",
                                secondShooterPrice: "Second shooter",
                              };
                              return (
                                <li key={key} className="flex justify-between text-sm text-muted-foreground">
                                  <span>{labels[key] ?? key}</span>
                                  <span className="font-meta">+{formatPrice(price)}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between pt-5 border-t border-border">
                      <div>
                        <span className="font-display text-2xl text-ink">
                          {formatPrice(pkg.basePrice)}
                        </span>
                        <span className="font-meta text-xs text-muted-foreground ml-2">
                          + 50% deposit
                        </span>
                      </div>
                      <Link
                        href={`/services/book?package=${pkg.id}`}
                        className="inline-flex items-center gap-1.5 bg-ink text-cream text-sm px-4 py-2 rounded-sm hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        Book <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Travel note */}
      <div className="mt-16 pt-8 border-t border-border">
        <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
          <strong className="text-ink">Travel:</strong> Packages based in Utah County. Travel within 60 miles included.
          For destination shoots, travel fees are quoted separately — reach out via the booking form and mention your location.
        </p>
      </div>
    </div>
  );
}
