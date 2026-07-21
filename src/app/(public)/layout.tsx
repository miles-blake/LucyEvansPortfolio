import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { auth } from "@/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const adminUser = session?.user ? { name: session.user.name ?? null } : null;

  return (
    <>
      <Nav adminUser={adminUser} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
