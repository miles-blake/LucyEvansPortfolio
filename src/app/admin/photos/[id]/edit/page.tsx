import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PhotoForm } from "@/components/admin/PhotoForm";
import { updatePhoto } from "../../actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Edit Photo" };
export const dynamic = "force-dynamic";

export default async function EditPhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/photos" className="text-sm text-muted-foreground hover:text-ink">← Photos</Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-display text-xl text-ink">Edit: {photo.title}</h1>
      </div>
      <PhotoForm action={updatePhoto} photo={photo} submitLabel="Save changes" />
    </div>
  );
}
