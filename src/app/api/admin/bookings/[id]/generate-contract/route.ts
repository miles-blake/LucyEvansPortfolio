import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [booking, template] = await Promise.all([
    prisma.booking.findUnique({
      where: { id },
      include: { package: { select: { name: true } } },
    }),
    prisma.contractTemplate.findFirst(),
  ]);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!template) {
    return NextResponse.json({ error: "No contract template saved yet." }, { status: 400 });
  }

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const React = await import("react");
  const { ContractPDF } = await import("@/components/ContractPDF");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = React.default.createElement(ContractPDF, {
    booking,
    templateBody: template.body,
  }) as any;

  const buffer: Buffer = await renderToBuffer(el);

  // Upload to Cloudinary as raw PDF
  const pdfUrl = await new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "contracts",
        public_id: booking.id,
        format: "pdf",
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

  // Upsert the BookingContract record
  await prisma.bookingContract.upsert({
    where: { bookingId: id },
    create: { bookingId: id, pdfUrl },
    update: { pdfUrl },
  });

  return NextResponse.json({ ok: true, pdfUrl });
}
