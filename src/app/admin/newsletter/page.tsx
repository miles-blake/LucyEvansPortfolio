import { prisma } from "@/lib/prisma";
import { NewsletterComposer } from "@/components/admin/NewsletterComposer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Newsletter" };
export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const history = await prisma.newsletter.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, subject: true, sentAt: true, recipientCount: true },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">Newsletter</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Write and send to all subscribers. Use AI to draft from an idea.
        </p>
      </div>
      <NewsletterComposer history={history} />
    </div>
  );
}
