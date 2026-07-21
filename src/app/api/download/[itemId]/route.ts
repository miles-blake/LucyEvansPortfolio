import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyDownloadToken } from "@/lib/download-token";

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
      bundle: { select: { title: true } },
    },
  });

  if (!item || item.order.status !== "PAID") {
    return new NextResponse("Download not available.", { status: 404 });
  }

  if (item.expiresAt && item.expiresAt < new Date()) {
    return new NextResponse("This download link has expired.", { status: 410 });
  }

  if (item.downloadCount >= item.downloadLimit) {
    return new NextResponse(
      "Download limit reached. Contact Lucy Evans to request additional downloads.",
      { status: 429 }
    );
  }

  const fileUrl = item.photo?.fullResFileUrl;
  if (!fileUrl) {
    return NextResponse.redirect(new URL(`/order/${item.orderId}/confirmation`, req.url));
  }

  // Increment before streaming so a failed fetch doesn't double-count on retry
  await prisma.orderItem.update({
    where: { id: itemId },
    data: { downloadCount: { increment: 1 } },
  });

  // Proxy the file through our server so the browser sees a same-origin response.
  // This is what makes Content-Disposition: attachment work on mobile — a cross-origin
  // redirect to Cloudinary loses the download intent and just opens in the browser.
  const upstream = await fetch(fileUrl);
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("File unavailable. Please try again.", { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const safeName = (item.photo?.title ?? "photo")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${safeName}.${ext}`;

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Forward content-length if Cloudinary provides it (enables progress bars)
      ...(upstream.headers.get("content-length")
        ? { "Content-Length": upstream.headers.get("content-length")! }
        : {}),
      // Don't cache download responses — each hit counts against the limit
      "Cache-Control": "no-store",
    },
  });
}
