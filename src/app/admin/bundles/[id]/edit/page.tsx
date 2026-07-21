import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateBundle } from "../../actions";
import { BundleForm } from "../../new/page";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Edit Bundle" };
export const dynamic = "force-dynamic";

export default async function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bundle, photos] = await Promise.all([
    prisma.bundle.findUnique({ where: { id }, include: { photos: true } }),
    prisma.photo.findMany({ orderBy: { title: "asc" } }),
  ]);
  if (!bundle) notFound();

  const selectedPhotoIds = bundle.photos.map((bp) => bp.photoId);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/bundles" className="text-sm text-muted-foreground hover:text-ink">← Bundles</Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-display text-xl text-ink">Edit: {bundle.title}</h1>
      </div>
      <BundleForm
        action={updateBundle}
        photos={photos}
        bundle={bundle}
        selectedPhotoIds={selectedPhotoIds}
        submitLabel="Save changes"
      />
    </div>
  );
}
