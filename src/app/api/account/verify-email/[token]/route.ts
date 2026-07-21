import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { emailVerifyToken: token },
  });

  if (!client) {
    return NextResponse.redirect(new URL("/account?verified=invalid", BASE_URL));
  }

  await prisma.client.update({
    where: { id: client.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });

  return NextResponse.redirect(new URL("/account?verified=1", BASE_URL));
}
