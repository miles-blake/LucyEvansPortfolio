import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) return new NextResponse("Not found", { status: 404 });

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const React = await import("react");
  const { InvoicePDF } = await import("@/components/InvoicePDF");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = React.default.createElement(InvoicePDF, { invoice: inv as any }) as any;
  const buffer: Buffer = await renderToBuffer(el);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${inv.number}.pdf"`,
    },
  });
}
