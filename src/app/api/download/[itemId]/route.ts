import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyDownloadToken } from "@/lib/download-token";
import { zipSync } from "fflate";

export async function GET(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const token = req.nextUrl.searchParams.get("token") ?? "";

  if (!verifyDownloadToken(itemId, token)) {
    return new NextResponse("Invalid download link.", { status: 403 });
  }

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: {
      order: { select: { status: true } },
      photo: { select: { fullResFileUrl: true, title: true } },
      bundle: {
        include: {
          photos: { include: { photo: { select: { fullResFileUrl: true, title: true } } } },
        },
      },
    },
  });

  if (!item || item.order.status !== "PAID") {
    return new NextResponse("Download not available.", { status: 404 });
  }

  await prisma.orderItem.update({
    where: { id: itemId },
    data: { downloadCount: { increment: 1 } },
  });

  // ── Single photo ────────────────────────────────────────────────────
  if (item.photo?.fullResFileUrl) {
    const upstream = await fetch(item.photo.fullResFileUrl);
    if (!upstream.ok || !upstream.body) {
      return new NextResponse("File unavailable. Please try again.", { status: 502 });
    }
    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const safeName = (item.photo.title ?? "photo")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeName}.${ext}"`,
        ...(upstream.headers.get("content-length")
          ? { "Content-Length": upstream.headers.get("content-length")! }
          : {}),
        "Cache-Control": "no-store",
      },
    });
  }

  // ── Bundle — zip all photos ─────────────────────────────────────────
  if (item.bundle) {
    const bundlePhotos = item.bundle.photos.map((bp) => bp.photo);
    if (bundlePhotos.length === 0) {
      return new NextResponse("Bundle has no photos.", { status: 404 });
    }

    const fetched = await Promise.all(
      bundlePhotos.map(async (p) => {
        const res = await fetch(p.fullResFileUrl);
        if (!res.ok) throw new Error(`Failed to fetch ${p.title}`);
        return { title: p.title, data: new Uint8Array(await res.arrayBuffer()) };
      })
    );

    const seen = new Map<string, number>();
    const files: Record<string, Uint8Array> = {};
    for (const { title, data } of fetched) {
      const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const count = seen.get(base) ?? 0;
      const filename = count > 0 ? `${base}-${count}.jpg` : `${base}.jpg`;
      seen.set(base, count + 1);
      files[filename] = data;
    }

    const zipped = zipSync(files, { level: 0 });
    const bundleName = item.bundle.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return new NextResponse(zipped, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${bundleName}.zip"`,
        "Content-Length": String(zipped.byteLength),
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse("Download not available.", { status: 404 });
}
