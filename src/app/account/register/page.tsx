import { registerClient } from "@/app/account/actions";
import Link from "next/link";
import type { Metadata } from "next";
import { AccountForm } from "@/components/account/AccountForm";

export const metadata: Metadata = { title: "Create Account" };

export default function ClientRegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink mb-2">Create an account</h1>
        <p className="font-meta text-xs text-muted-foreground mb-8">
          Track your bookings, view invoices, and access your client portal.
        </p>

        <AccountForm action={registerClient} submitLabel="Create account">
          <div>
            <label className="font-meta text-xs text-muted-foreground block mb-1">Full name</label>
            <input name="name" type="text" required autoComplete="name"
              className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30" />
          </div>
          <div>
            <label className="font-meta text-xs text-muted-foreground block mb-1">Email</label>
            <input name="email" type="email" required autoComplete="email"
              className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30" />
          </div>
          <div>
            <label className="font-meta text-xs text-muted-foreground block mb-1">Password</label>
            <input name="password" type="password" required autoComplete="new-password" minLength={8}
              className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30" />
            <p className="font-meta text-[11px] text-muted-foreground mt-1">Minimum 8 characters</p>
          </div>
        </AccountForm>

        <p className="font-meta text-xs text-muted-foreground mt-6 text-center">
          Already have an account?{" "}
          <Link href="/account/login" className="text-ink underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
