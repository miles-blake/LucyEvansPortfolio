"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-cream">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b border-border bg-cream/95 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1.5 rounded-sm hover:bg-ink/5 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-display text-sm text-ink">Admin</span>
        </div>

        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
