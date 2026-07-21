import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const packages = await prisma.servicePackage.findMany({
    orderBy: { basePrice: "asc" },
  });
  return NextResponse.json({ packages });
}
