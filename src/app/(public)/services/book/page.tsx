import { Suspense } from "react";
import BookingForm from "@/components/booking/BookingForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Session",
  description: "Book a film photography session with Lucy Evans — portraits, elopements, events, and weddings.",
};

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    }>
      <BookingForm />
    </Suspense>
  );
}
