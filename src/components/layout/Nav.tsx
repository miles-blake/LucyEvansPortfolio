"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist-store";

const photoLinks = [
  { href: "/gallery", label: "Gallery" },
  { href: "/bundles", label: "Bundles" },
  { href: "/services", label: "Services" },
];

const marketingLinks = [
  { href: "/work", label: "Work" },
  { href: "/media-kit", label: "Media Kit" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const isAdmin = !!session?.user && !session.user.isTestClient;
  const isTestClient = session?.user?.isTestClient === true;
  const wishlistCount = useWishlist((s) => s.items.length);

  const isMarketing =
    pathname.startsWith("/work") || pathname.startsWith("/media-kit");

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-ink hover:opacity-70 transition-opacity"
        >
          Lucy Evans
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {/* Photography side */}
          <div className="flex items-center gap-6">
            {photoLinks.map(({ href, label }) => (
              <NavLink key={href} href={href} active={pathname.startsWith(href)}>
                {label}
              </NavLink>
            ))}
          </div>

          <span className="w-px h-4 bg-border" />

          {/* Marketing side */}
          <div className="flex items-center gap-6">
            {marketingLinks.map(({ href, label }) => (
              <NavLink key={href} href={href} active={pathname.startsWith(href)}>
                {label}
              </NavLink>
            ))}
          </div>

          <span className="w-px h-4 bg-border" />

          <NavLink href="/about" active={pathname === "/about"}>
            About
          </NavLink>

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="relative text-ink hover:opacity-70 transition-opacity"
          >
            <Bookmark size={20} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-ink text-cream font-meta text-[9px] leading-none">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            aria-label="Cart"
            className="text-ink hover:opacity-70 transition-opacity"
          >
            <CartIcon />
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="font-meta text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity"
            >
              Admin
            </Link>
          )}
          {!isAdmin && !isTestClient && (
            <Link
              href="/admin/login"
              className="font-meta text-xs text-muted-foreground hover:text-ink transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-md text-ink hover:bg-muted transition-colors focus-visible:outline-2 focus-visible:outline-ring"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block w-5 h-0.5 bg-ink mb-1 transition-transform" />
          <span className="block w-5 h-0.5 bg-ink mb-1 transition-opacity" />
          <span className="block w-5 h-0.5 bg-ink transition-transform" />
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-cream px-4 py-6 flex flex-col gap-4">
          <p className="font-meta text-muted-foreground mb-1">Photography</p>
          {photoLinks.map(({ href, label }) => (
            <MobileLink key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </MobileLink>
          ))}
          <p className="font-meta text-muted-foreground mt-3 mb-1">Marketing</p>
          {marketingLinks.map(({ href, label }) => (
            <MobileLink key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </MobileLink>
          ))}
          <div className="h-px bg-border my-2" />
          <MobileLink href="/about" onClick={() => setOpen(false)}>
            About
          </MobileLink>
          <MobileLink href="/wishlist" onClick={() => setOpen(false)}>
            Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
          </MobileLink>
          <MobileLink href="/cart" onClick={() => setOpen(false)}>
            Cart
          </MobileLink>
          <div className="h-px bg-border my-2" />
          {isAdmin && (
            <MobileLink href="/admin" onClick={() => setOpen(false)}>
              Admin panel
            </MobileLink>
          )}
          {!isAdmin && !isTestClient && (
            <MobileLink href="/admin/login" onClick={() => setOpen(false)}>
              Sign in
            </MobileLink>
          )}
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm transition-opacity focus-visible:outline-2 focus-visible:outline-ring rounded-sm",
        active ? "text-ink font-medium" : "text-muted-foreground hover:text-ink"
      )}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-base text-ink hover:opacity-70 transition-opacity"
    >
      {children}
    </Link>
  );
}

function CartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
