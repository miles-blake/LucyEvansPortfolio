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
    return new NextResponse("Download limit reached. Contact Lucy Evans to request additional downloads.", { status: 429 });
  }

  // Increment download count
  await prisma.orderItem.update({
    where: { id: itemId },
    data: { downloadCount: { increment: 1 } },
  });

  // For bundles, redirect to a zip or the first photo — for now redirect to the order page
  // so they see the individual photos in the bundle
  const fileUrl = item.photo?.fullResFileUrl;
  if (!fileUrl) {
    return NextResponse.redirect(
      new URL(`/order/${item.orderId}/confirmation`, req.url)
    );
  }

  // Redirect to the Cloudinary full-res file
  return NextResponse.redirect(fileUrl);
}
