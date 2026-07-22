import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ count: 0 });

  const count = await prisma.venmoPayment.count({ where: { status: "pending" } });
  return NextResponse.json({ count });
}
