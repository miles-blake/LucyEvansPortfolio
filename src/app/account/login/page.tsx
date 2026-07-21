import { loginClient } from "@/app/account/actions";
import Link from "next/link";
import type { Metadata } from "next";
import { AccountForm } from "@/components/account/AccountForm";

export const metadata: Metadata = { title: "Sign In" };

export default function ClientLoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink mb-2">Welcome back</h1>
        <p className="font-meta text-xs text-muted-foreground mb-8">
          Sign in to view your bookings and invoices.
        </p>

        <AccountForm action={loginClient} submitLabel="Sign in">
          <div>
            <label className="font-meta text-xs text-muted-foreground block mb-1">Email</label>
            <input name="email" type="email" required autoComplete="email"
              className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30" />
          </div>
          <div>
            <label className="font-meta text-xs text-muted-foreground block mb-1">Password</label>
            <input name="password" type="password" required autoComplete="current-password"
              className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30" />
          </div>
        </AccountForm>

        <p className="font-meta text-xs text-muted-foreground mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/account/register" className="text-ink underline underline-offset-2">Create one</Link>
        </p>
      </div>
    </div>
  );
}
