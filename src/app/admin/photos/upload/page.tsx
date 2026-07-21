import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BulkPhotoUpload } from "@/components/admin/BulkPhotoUpload";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Bulk Photo Upload" };

export default function BulkUploadPage() {
  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/photos"
        className="inline-flex items-center gap-2 font-meta text-muted-foreground hover:text-ink transition-colors text-sm mb-6"
      >
        <ArrowLeft size={14} /> Back to photos
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-ink">Bulk upload</h1>
          <p className="font-meta text-sm text-muted-foreground mt-1">
            Upload multiple photos at once. Set shared metadata, then save to your library.
          </p>
        </div>
      </div>

      <BulkPhotoUpload />
    </div>
  );
}
