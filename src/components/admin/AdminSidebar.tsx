"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Camera,
  Package,
  CalendarDays,
  ShoppingBag,
  Briefcase,
  Users,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  ExternalLink,
  Mail,
  FileText,
  Send,
  CalendarOff,
  BarChart2,
  Tag,
  Settings,
  X,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/photos", label: "Photos", icon: Camera },
  { href: "/admin/bundles", label: "Bundles", icon: Package },
  { href: "/admin/services", label: "Services", icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/availability", label: "Availability", icon: CalendarOff },
  { href: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
  { href: "/admin/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/admin/subscribers", label: "Subscribers", icon: Users },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/email", label: "Email", icon: Send },
  { href: "/admin/discounts", label: "Discounts", icon: Tag },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface Props {
  open?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ open = false, onClose }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "Admin";
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/unread-messages")
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count ?? 0))
      .catch(() => {});
  }, [pathname]); // re-check whenever admin navigates

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div>
          <p className="font-meta text-xs text-muted-foreground uppercase tracking-widest">Admin</p>
          <p className="font-display text-sm text-ink mt-0.5 truncate">{userName}</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1 -mr-1 rounded-sm hover:bg-ink/5 transition-colors text-muted-foreground"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={`flex items-center gap-2.5 px-4 py-2.5 md:py-2 text-sm transition-colors ${
              isActive(href, exact)
                ? "text-ink bg-ink/5 border-r-2 border-ink"
                : "text-muted-foreground hover:text-ink hover:bg-ink/5"
            }`}
          >
            <Icon size={15} />
            <span className="flex-1">{label}</span>
            {href === "/admin/bookings" && unreadCount > 0 && (
              <span className="ml-auto bg-rose text-cream text-[10px] font-meta font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={() => {
            onClose?.();
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
          }}
          className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-ink transition-colors w-full"
        >
          <Search size={15} />
          <span className="flex-1 text-left">Search</span>
          <kbd className="font-meta text-[10px] bg-ink/8 px-1.5 py-0.5 rounded hidden md:block">⌘K</kbd>
        </button>
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-ink transition-colors"
        >
          <ExternalLink size={15} />
          View site
        </Link>
        <a
          href="/api/admin/preview"
          className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-ink transition-colors"
        >
          <ExternalLink size={15} />
          Preview as visitor
        </a>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-ink w-full transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "flex flex-col bg-cream border-r border-border",
          // Desktop: always-visible sidebar
          "md:relative md:w-52 md:shrink-0 md:min-h-screen md:translate-x-0 md:flex",
          // Mobile: fixed drawer
          "fixed inset-y-0 left-0 z-50 w-72 min-h-screen transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
