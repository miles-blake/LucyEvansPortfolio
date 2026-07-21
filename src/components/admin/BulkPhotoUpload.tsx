"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  publicId?: string;
  secureUrl?: string;
  error?: string;
}

interface SharedMeta {
  filmStock: string;
  camera: string;
  collectionTag: string;
  location: string;
}

interface CreateResult {
  error?: string;
}

export function BulkPhotoUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [shared, setShared] = useState<SharedMeta>({ filmStock: "", camera: "", collectionTag: "", location: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const items: UploadFile[] = Array.from(newFiles).map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}`,
      file: f,
      preview: URL.createObjectURL(f),
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...items]);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, []);

  function removeFile(id: string) {
    setFiles((prev) => {
      const f = prev.find((f) => f.id === id);
      if (f) URL.revokeObjectURL(f.preview);
      return prev.filter((f) => f.id !== id);
    });
  }

  async function uploadAll() {
    setUploading(true);
    const pending = files.filter((f) => f.status === "pending");

    // Get a signed upload credential from the server (avoids sending large files through Vercel)
    const sigRes = await fetch("/api/admin/upload/signature");
    const { signature, timestamp, cloudName, apiKey, folder } = await sigRes.json();

    for (const item of pending) {
      setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: "uploading" } : f));
      try {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("signature", signature);
        fd.append("timestamp", String(timestamp));
        fd.append("api_key", apiKey);
        fd.append("folder", folder);

        // Use auto/upload so Cloudinary accepts both standard images and RAW formats (NEF, CR2, etc.)
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          { method: "POST", body: fd }
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error.message ?? JSON.stringify(data.error));
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "done", publicId: data.public_id, secureUrl: data.secure_url }
              : f
          )
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: "error", error: (err as Error).message } : f
          )
        );
      }
    }
    setUploading(false);
  }

  async function saveAll() {
    const done = files.filter((f) => f.status === "done" && f.secureUrl && f.publicId);
    if (done.length === 0) return;
    setSaving(true);

    const { createBulkPhotos } = await import("@/app/admin/photos/upload/actions");
    const result: CreateResult = await createBulkPhotos({
      photos: done.map((f) => ({
        title: f.file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        previewImageUrl: f.secureUrl!,
        fullResFileUrl: f.publicId!,
      })),
      shared,
    });

    setSaving(false);
    if (!result.error) {
      router.push("/admin/photos");
    }
  }

  const doneCount = files.filter((f) => f.status === "done").length;
  const pendingCount = files.filter((f) => f.status === "pending").length;
  const inputCls = "w-full text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky/40";

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-sm p-10 text-center cursor-pointer transition-colors ${dragOver ? "border-sky bg-sky/5" : "border-border hover:border-sky/50"}`}
      >
        <p className="text-muted-foreground text-sm">Drop photos here or click to select</p>
        <p className="font-meta text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, NEF, CR2, CR3, ARW, DNG, RAF — multiple files OK</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.nef,.nrw,.cr2,.cr3,.arw,.dng,.raf,.orf,.rw2,.pef,.srw,.x3f,.3fr,.dcr,.kdc,.mef,.mrw,.ptx,.r3d,.rwl,.srf,.sr2"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <>
          {/* File grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((f) => (
              <div key={f.id} className="relative border border-border rounded-sm overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.preview} alt={f.file.name} className="w-full aspect-square object-cover" />
                <div className={`absolute inset-0 flex items-center justify-center text-xs font-meta ${
                  f.status === "uploading" ? "bg-black/40 text-white" :
                  f.status === "done" ? "bg-sage/20" :
                  f.status === "error" ? "bg-rose/20 text-rose" : ""
                }`}>
                  {f.status === "uploading" && "Uploading…"}
                  {f.status === "done" && <span className="text-sage text-lg">✓</span>}
                  {f.status === "error" && (
                    <span className="text-center px-1">{f.error ?? "Error"}</span>
                  )}
                </div>
                {f.status === "pending" && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                    className="absolute top-1 right-1 w-5 h-5 bg-ink/70 text-cream rounded-full text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                )}
                <p className="px-1.5 py-1 text-xs text-muted-foreground truncate font-meta">{f.file.name}</p>
              </div>
            ))}
          </div>

          {/* Shared metadata */}
          <section className="border border-border rounded-sm p-6">
            <h2 className="font-display text-lg text-ink mb-4">Shared metadata</h2>
            <p className="font-meta text-xs text-muted-foreground mb-4">These fields will apply to all photos in this batch. You can edit individual photos afterwards.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {(["filmStock", "camera", "collectionTag", "location"] as const).map((field) => (
                <div key={field}>
                  <label className="font-meta text-xs text-muted-foreground block mb-1 capitalize">
                    {field.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    type="text"
                    value={shared[field]}
                    onChange={(e) => setShared((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder={field === "filmStock" ? "Kodak Portra 400" : field === "camera" ? "Canon AE-1" : ""}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={uploadAll}
                disabled={uploading}
                className="bg-ink text-cream px-3 py-1.5 rounded-sm text-xs font-meta hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {uploading ? "Uploading…" : `Upload ${pendingCount} photo${pendingCount !== 1 ? "s" : ""}`}
              </button>
            )}
            {doneCount > 0 && pendingCount === 0 && !uploading && (
              <button
                type="button"
                onClick={saveAll}
                disabled={saving}
                className="bg-sage text-white px-3 py-1.5 rounded-sm text-xs font-meta hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving…" : `Save ${doneCount} photo${doneCount !== 1 ? "s" : ""} to library`}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
