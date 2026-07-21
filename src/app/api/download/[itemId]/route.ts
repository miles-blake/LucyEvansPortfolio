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
    },
  });

  if (!item || item.order.status !== "PAID") {
    return new NextResponse("Download not available.", { status: 404 });
  }

  const fileUrl = item.photo?.fullResFileUrl;
  if (!fileUrl) {
    return NextResponse.redirect(new URL(`/order/${item.orderId}/confirmation`, req.url));
  }

  // Track download count for analytics (no limit enforced)
  await prisma.orderItem.update({
    where: { id: itemId },
    data: { downloadCount: { increment: 1 } },
  });

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
