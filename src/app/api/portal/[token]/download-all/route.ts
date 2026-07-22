import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { zipSync, strToU8 } from "fflate";

interface Props {
  params: Promise<{ token: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
  const { token } = await params;

  const portalToken = await prisma.clientPortalToken.findUnique({
    where: { token },
    include: { booking: { select: { id: true } } },
  });

  if (!portalToken || portalToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired portal link." }, { status: 403 });
  }

  const assets = await prisma.deliveredAsset.findMany({
    where: { bookingId: portalToken.booking.id },
    orderBy: { createdAt: "asc" },
  });

  if (assets.length === 0) {
    return NextResponse.json({ error: "No photos to download." }, { status: 404 });
  }

  // Download all assets in parallel
  const fetched = await Promise.all(
    assets.map(async (a) => {
      const res = await fetch(a.url);
      if (!res.ok) throw new Error(`Failed to fetch ${a.name}`);
      const buf = await res.arrayBuffer();
      return { name: a.name, data: new Uint8Array(buf) };
    })
  );

  // De-duplicate filenames
  const seen = new Map<string, number>();
  const files: Record<string, Uint8Array> = {};
  for (const { name, data } of fetched) {
    let filename = name;
    const count = seen.get(name) ?? 0;
    if (count > 0) {
      const dot = name.lastIndexOf(".");
      filename = dot >= 0
        ? `${name.slice(0, dot)} (${count})${name.slice(dot)}`
        : `${name} (${count})`;
    }
    seen.set(name, count + 1);
    files[filename] = data;
  }

  const zipped = zipSync(files, { level: 0 }); // level 0 = store, images are already compressed

  return new NextResponse(zipped, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="photos.zip"`,
      "Content-Length": String(zipped.byteLength),
    },
  });
}
