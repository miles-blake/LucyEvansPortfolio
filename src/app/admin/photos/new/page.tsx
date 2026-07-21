import { PhotoForm } from "@/components/admin/PhotoForm";
import { createPhoto } from "../actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — New Photo" };

export default function NewPhotoPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/photos" className="text-sm text-muted-foreground hover:text-ink">← Photos</Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-display text-xl text-ink">New photo</h1>
      </div>
      <PhotoForm action={createPhoto} submitLabel="Create photo" />
    </div>
  );
}
