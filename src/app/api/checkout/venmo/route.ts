import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { getBundleDiscountPct } from "@/lib/bundle-discount";

const itemSchema = z.object({
  id: z.string(),
  type: z.enum(["photo", "bundle"]),
  price: z.number().int().positive(),
});

const schema = z.object({
  items: z.array(itemSchema).min(1),
  discountCode: z.string().optional(),
  bundlePct: z.number().int().min(0).max(20).optional(),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  customerPhone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, discountCode, bundlePct: clientBundlePct, customerName, customerEmail, customerPhone } = schema.parse(body);

    // Verify prices server-side
    const verifiedItems = await Promise.all(
      items.map(async (item) => {
        if (item.type === "photo") {
          const photo = await prisma.photo.findUnique({ where: { id: item.id } });
          if (!photo) throw new Error(`Photo not found: ${item.id}`);
          return { name: photo.title, price: photo.price, id: item.id, type: "photo" as const };
        } else {
          const bundle = await prisma.bundle.findUnique({ where: { id: item.id } });
          if (!bundle) throw new Error(`Bundle not found: ${item.id}`);
          return { name: bundle.title, price: bundle.price, id: item.id, type: "bundle" as const };
        }
      })
    );

    // Discount code
    let discount: { type: string; amount: number } | null = null;
    if (discountCode) {
      const code = await prisma.discountCode.findUnique({ where: { code: discountCode.trim().toUpperCase() } });
      if (!code || !code.active || (code.expiresAt && code.expiresAt < new Date())) {
        return NextResponse.json({ error: "Invalid or expired discount code." }, { status: 400 });
      }
      discount = code;
    }

    const photoCount = verifiedItems.filter((i) => i.type === "photo").length;
    const serverBundlePct = getBundleDiscountPct(photoCount);
    if (clientBundlePct !== undefined && clientBundlePct !== serverBundlePct) {
      return NextResponse.json({ error: "Invalid bundle discount." }, { status: 400 });
    }

    const photoSubtotal = verifiedItems.filter((i) => i.type === "photo").reduce((s, i) => s + i.price, 0);
    const bundleSavings = Math.round((photoSubtotal * serverBundlePct) / 100);
    const subtotal = verifiedItems.reduce((s, i) => s + i.price, 0);
    let discountAmount = bundleSavings;
    if (discount) {
      const afterBundle = subtotal - bundleSavings;
      discountAmount += discount.type === "percent"
        ? Math.round((afterBundle * discount.amount) / 100)
        : Math.min(discount.amount, afterBundle);
    }
    const total = Math.max(0, subtotal - discountAmount);

    const order = await prisma.order.create({
      data: {
        customerEmail,
        customerName,
        customerPhone: customerPhone || null,
        totalAmount: total,
        status: "PENDING",
        items: {
          create: verifiedItems.map((i) => ({
            ...(i.type === "photo" ? { photoId: i.id } : { bundleId: i.id }),
            price: i.price,
          })),
        },
      },
    });

    return NextResponse.json({ orderId: order.id, total });
  } catch (err) {
    console.error("[checkout/venmo]", err);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
