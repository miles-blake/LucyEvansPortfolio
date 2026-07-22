import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { emailA?: string; emailB?: string; canonicalName?: string };
  const { emailA, emailB, canonicalName } = body;

  if (!emailA || !emailB || !canonicalName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Collect phones from bookings for both emails (deduped)
  const bookingsForBoth = await prisma.booking.findMany({
    where: { customerEmail: { in: [emailA, emailB] } },
    select: { customerPhone: true },
  });

  const phoneSet = new Set<string>();
  for (const b of bookingsForBoth) {
    if (b.customerPhone) phoneSet.add(b.customerPhone);
  }
  const phones = Array.from(phoneSet);

  // Look up existing profiles for each email
  const [profileA, profileB] = await Promise.all([
    prisma.clientProfile.findFirst({ where: { emails: { has: emailA } } }),
    prisma.clientProfile.findFirst({ where: { emails: { has: emailB } } }),
  ]);

  if (profileA && profileB) {
    // Both already in profiles — merge them: combine into profileA, delete profileB
    if (profileA.id === profileB.id) {
      // Already the same profile — just update name
      await prisma.clientProfile.update({
        where: { id: profileA.id },
        data: { name: canonicalName },
      });
    } else {
      const mergedEmails = Array.from(new Set([...profileA.emails, ...profileB.emails]));
      const mergedPhones = Array.from(new Set([...profileA.phones, ...profileB.phones, ...phones]));
      await prisma.$transaction([
        prisma.clientProfile.update({
          where: { id: profileA.id },
          data: { name: canonicalName, emails: mergedEmails, phones: mergedPhones },
        }),
        prisma.clientProfile.delete({ where: { id: profileB.id } }),
      ]);
    }
  } else if (profileA && !profileB) {
    // emailA is in a profile — add emailB
    const mergedEmails = Array.from(new Set([...profileA.emails, emailB]));
    const mergedPhones = Array.from(new Set([...profileA.phones, ...phones]));
    await prisma.clientProfile.update({
      where: { id: profileA.id },
      data: { name: canonicalName, emails: mergedEmails, phones: mergedPhones },
    });
  } else if (!profileA && profileB) {
    // emailB is in a profile — add emailA
    const mergedEmails = Array.from(new Set([...profileB.emails, emailA]));
    const mergedPhones = Array.from(new Set([...profileB.phones, ...phones]));
    await prisma.clientProfile.update({
      where: { id: profileB.id },
      data: { name: canonicalName, emails: mergedEmails, phones: mergedPhones },
    });
  } else {
    // Neither email is in a profile — create a new one
    await prisma.clientProfile.create({
      data: {
        name: canonicalName,
        emails: [emailA, emailB],
        phones,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
