import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Unsubscribed — Lucy Evans" };

export default function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  void searchParams;
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-ink mb-4">You&rsquo;re unsubscribed</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          You&rsquo;ve been removed from the Lucy Evans newsletter. You won&rsquo;t receive any more
          emails from this list.
        </p>
        <Link
          href="/"
          className="font-meta text-sm text-muted-foreground hover:text-ink transition-colors underline underline-offset-4"
        >
          Back to site
        </Link>
      </div>
    </div>
  );
}
