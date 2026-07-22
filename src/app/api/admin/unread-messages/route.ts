import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ count: 0 }, { status: 401 });

  const [messages, inquiries] = await Promise.all([
    prisma.bookingMessage.count({
      where: { senderRole: "client", readByAdmin: false },
    }),
    prisma.inquiry.count({
      where: { status: "NEW" },
    }),
  ]);

  return NextResponse.json({ count: messages + inquiries });
}
