import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateService } from "../../actions";
import { ServiceForm } from "../../new/page";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Edit Service" };
export const dynamic = "force-dynamic";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = await prisma.servicePackage.findUnique({ where: { id } });
  if (!pkg) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/services" className="text-sm text-muted-foreground hover:text-ink">← Services</Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-display text-xl text-ink">Edit: {pkg.name}</h1>
      </div>
      <ServiceForm action={updateService} pkg={pkg} submitLabel="Save changes" />
    </div>
  );
}
