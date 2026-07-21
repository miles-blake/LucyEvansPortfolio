import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const subscriber = await prisma.subscriber.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!subscriber) {
    return NextResponse.redirect(new URL("/unsubscribed?status=notfound", BASE_URL));
  }

  await prisma.subscriber.update({
    where: { unsubscribeToken: token },
    data: { confirmed: false },
  });

  return NextResponse.redirect(new URL("/unsubscribed", BASE_URL));
}
