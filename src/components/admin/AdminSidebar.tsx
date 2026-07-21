"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
} from "lucide-react";

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

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "Admin";

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="w-52 shrink-0 border-r border-border flex flex-col min-h-screen">
      <div className="p-4 border-b border-border">
        <p className="font-meta text-xs text-muted-foreground uppercase tracking-widest">Admin</p>
        <p className="font-display text-sm text-ink mt-0.5 truncate">{userName}</p>
      </div>

      <nav className="flex-1 py-2">
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
              isActive(href, exact)
                ? "text-ink bg-ink/5 border-r-2 border-ink"
                : "text-muted-foreground hover:text-ink hover:bg-ink/5"
            }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Link
          href="/"
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
    </aside>
  );
}
