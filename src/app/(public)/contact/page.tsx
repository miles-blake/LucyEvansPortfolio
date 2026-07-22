import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Lucy Evans — film photography prints, marketing collaborations, or just to say hello.",
};

export default async function ContactPage() {
  const [session, packages] = await Promise.all([
    auth(),
    prisma.servicePackage.findMany({ select: { id: true, name: true }, orderBy: { basePrice: "asc" } }),
  ]);

  const prefill =
    session?.user?.role === "client"
      ? { name: session.user.name ?? "", email: session.user.email ?? "" }
      : undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <p className="font-meta text-xs text-muted-foreground uppercase tracking-widest mb-3">
        Contact
      </p>
      <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">
        Get in touch.
      </h1>
      <p className="text-muted-foreground leading-relaxed mb-10">
        Whether you&apos;re curious about a package, have questions before booking, or just want to connect — I&apos;d love to hear from you. I typically respond within one to two business days.
      </p>

      <ContactForm packages={packages} prefill={prefill} />
    </div>
  );
}
