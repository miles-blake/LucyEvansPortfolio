import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Auth protection is handled by middleware (src/middleware.ts).
// The layout itself stays Prisma-free so Turbopack never bundles server-only
// modules into the client chunk for the login page.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-cream">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
    </div>
  );
}
