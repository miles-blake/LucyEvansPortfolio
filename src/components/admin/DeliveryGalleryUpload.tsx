"use client";

import { useState, useRef } from "react";
import { saveDeliveredAsset } from "@/app/admin/bookings/delivery-actions";

interface UploadedFile {
  id: string;
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
}

export function DeliveryGalleryUpload({ bookingId }: { bookingId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadedFile[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const sigRes = await fetch("/api/admin/upload/signature");
    const { signature, timestamp, cloudName, apiKey, folder } = await sigRes.json();

    for (const file of Array.from(files)) {
      const uid = `${file.name}-${Date.now()}`;
      setUploading((p) => [...p, { id: uid, name: file.name, status: "uploading" }]);

      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("signature", signature);
        fd.append("timestamp", String(timestamp));
        fd.append("api_key", apiKey);
        fd.append("folder", `${folder}/delivery`);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: "POST", body: fd,
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        const actionFd = new FormData();
        actionFd.append("bookingId", bookingId);
        actionFd.append("name", file.name.replace(/\.[^.]+$/, ""));
        actionFd.append("url", data.secure_url);
        actionFd.append("publicId", data.public_id);
        await saveDeliveredAsset(actionFd);

        setUploading((p) => p.map((f) => f.id === uid ? { ...f, status: "done" } : f));
      } catch (err) {
        setUploading((p) => p.map((f) => f.id === uid
          ? { ...f, status: "error", error: (err as Error).message } : f));
      }
    }
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-sm p-6 text-center cursor-pointer hover:border-ink/30 transition-colors"
      >
        <p className="font-meta text-xs text-muted-foreground">Click to upload photos for this client</p>
        <input ref={inputRef} type="file" multiple accept="image/*,.nef,.cr2,.cr3,.arw,.dng"
          className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {uploading.length > 0 && (
        <ul className="space-y-1">
          {uploading.map((f) => (
            <li key={f.id} className="flex items-center gap-2 text-xs font-meta">
              <span className={f.status === "done" ? "text-sage" : f.status === "error" ? "text-rose-500" : "text-muted-foreground"}>
                {f.status === "done" ? "✓" : f.status === "error" ? "✗" : "↑"}
              </span>
              <span className="text-ink truncate">{f.name}</span>
              {f.error && <span className="text-rose-500">{f.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
