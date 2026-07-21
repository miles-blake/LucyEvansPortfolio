import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Lucy Evans — film photography prints, marketing collaborations, or just to say hello.",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <p className="font-meta text-xs text-muted-foreground uppercase tracking-widest mb-3">
        Contact
      </p>
      <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">
        Get in touch.
      </h1>
      <p className="text-muted-foreground leading-relaxed mb-10">
        Whether you&apos;re interested in a print, a brand collaboration, or just want to connect — I&apos;d love to hear from you. I typically respond within one to two business days.
      </p>

      <ContactForm />
    </div>
  );
}
