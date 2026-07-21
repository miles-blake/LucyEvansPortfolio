import type { Metadata } from "next";
import { EmailComposeForm } from "@/components/admin/EmailComposeForm";

export const metadata: Metadata = { title: "Admin — Email" };

interface Props {
  searchParams: Promise<{ to?: string; subject?: string }>;
}

export default async function AdminEmailPage({ searchParams }: Props) {
  const { to, subject } = await searchParams;
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-ink mb-8">Send email</h1>
      <EmailComposeForm defaultTo={to} defaultSubject={subject} />
    </div>
  );
}
