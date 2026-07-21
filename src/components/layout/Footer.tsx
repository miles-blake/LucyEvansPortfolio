import Link from "next/link";
import NewsletterForm from "@/components/newsletter/NewsletterForm";

const photoLinks = [
  { href: "/gallery", label: "Gallery" },
  { href: "/bundles", label: "Bundles" },
  { href: "/services", label: "Services & Booking" },
];

const marketingLinks = [
  { href: "/work", label: "Case Studies" },
  { href: "/media-kit", label: "Media Kit" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/license", label: "Photo License" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-cream mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="font-display text-lg font-semibold text-ink hover:opacity-70 transition-opacity"
            >
              Lucy Evans
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Film photographer and content marketer based in Utah County, Utah. Available to travel.
            </p>
          </div>

          {/* Photography */}
          <div>
            <p className="font-meta text-muted-foreground mb-4">Photography</p>
            <ul className="space-y-2">
              {photoLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-ink hover:opacity-70 transition-opacity"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketing */}
          <div>
            <p className="font-meta text-muted-foreground mb-4">Marketing</p>
            <ul className="space-y-2">
              {marketingLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-ink hover:opacity-70 transition-opacity"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/about"
                  className="text-sm text-ink hover:opacity-70 transition-opacity"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-ink hover:opacity-70 transition-opacity"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="font-meta text-muted-foreground mb-4">Stay in touch</p>
            <p className="text-sm text-ink mb-4 leading-relaxed">
              New prints, case studies, and the occasional dispatch from the field.
            </p>
            <NewsletterForm source="footer" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-meta text-muted-foreground">
            © {new Date().getFullYear()} Lucy Evans. All rights reserved.
          </p>
          <nav aria-label="Legal links" className="flex items-center gap-6">
            {legalLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-meta text-muted-foreground hover:text-ink transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
