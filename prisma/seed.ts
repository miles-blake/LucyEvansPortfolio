import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin users ───────────────────────────────────────────────────
  const password = await bcrypt.hash("lucywebsite12345", 12);

  await prisma.adminUser.upsert({
    where: { email: "mileshblake@gmail.com" },
    update: {},
    create: { name: "Miles Blake", email: "mileshblake@gmail.com", hashedPassword: password },
  });
  await prisma.adminUser.upsert({
    where: { email: "thebeachkid99@gmail.com" },
    update: {},
    create: { name: "Lucy Evans", email: "thebeachkid99@gmail.com", hashedPassword: password },
  });

  // ── Photos ────────────────────────────────────────────────────────
  const photos = await Promise.all([
    prisma.photo.upsert({
      where: { slug: "golden-hour-cascade" },
      update: {},
      create: {
        title: "Golden Hour Cascade",
        slug: "golden-hour-cascade",
        description: "Shot on a late-August evening, the light fell exactly right through the canyon for about four minutes. I burned through two rolls waiting for it.",
        location: "Columbia River Gorge, Oregon",
        captureDate: new Date("2023-08-15"),
        filmStock: "Kodak Portra 400",
        camera: "Pentax 67",
        collectionTag: "Pacific Northwest",
        previewImageUrl: "https://picsum.photos/seed/cascade/800/1000",
        fullResFileUrl: "https://placeholder.lucyevans.com/full/golden-hour-cascade.tif",
        price: 3500,
        featured: true,
      },
    }),
    prisma.photo.upsert({
      where: { slug: "fog-over-crater" },
      update: {},
      create: {
        title: "Fog Over Crater",
        slug: "fog-over-crater",
        description: "Arrived at 4am to catch the fog rolling in. The lake was completely invisible until it broke at dawn.",
        location: "Crater Lake, Oregon",
        captureDate: new Date("2023-09-02"),
        filmStock: "Fuji Velvia 50",
        camera: "Mamiya RZ67",
        collectionTag: "Pacific Northwest",
        previewImageUrl: "https://picsum.photos/seed/crater/800/1000",
        fullResFileUrl: "https://placeholder.lucyevans.com/full/fog-over-crater.tif",
        price: 3500,
        isLimitedEdition: true,
        editionSize: 25,
        editionSold: 8,
      },
    }),
    prisma.photo.upsert({
      where: { slug: "salt-flat-horizon" },
      update: {},
      create: {
        title: "Salt Flat Horizon",
        slug: "salt-flat-horizon",
        description: "The Bonneville Salt Flats in mid-October — the reflection season. Drove out at 3am, the sky turned pink at 6:47.",
        location: "Bonneville Salt Flats, Utah",
        captureDate: new Date("2023-10-12"),
        filmStock: "Kodak Ektar 100",
        camera: "Hasselblad 500C/M",
        collectionTag: "Desert Southwest",
        previewImageUrl: "https://picsum.photos/seed/saltflat/1000/700",
        fullResFileUrl: "https://placeholder.lucyevans.com/full/salt-flat-horizon.tif",
        price: 4500,
        featured: true,
      },
    }),
    prisma.photo.upsert({
      where: { slug: "redwood-cathedral" },
      update: {},
      create: {
        title: "Redwood Cathedral",
        slug: "redwood-cathedral",
        description: "The understory light in old-growth redwood is unlike anything else — green, diffused, ancient.",
        location: "Jedediah Smith Redwoods, California",
        captureDate: new Date("2023-11-05"),
        filmStock: "Kodak Portra 800",
        camera: "Pentax 67",
        collectionTag: "California Coast",
        previewImageUrl: "https://picsum.photos/seed/redwood/800/1100",
        fullResFileUrl: "https://placeholder.lucyevans.com/full/redwood-cathedral.tif",
        price: 3500,
      },
    }),
    prisma.photo.upsert({
      where: { slug: "high-alpine-still" },
      update: {},
      create: {
        title: "High Alpine Still",
        slug: "high-alpine-still",
        description: "11,000 feet. No wind. The lake surface was a mirror for about twenty minutes before a storm rolled in from the west.",
        location: "Rocky Mountain National Park, Colorado",
        captureDate: new Date("2024-07-20"),
        filmStock: "Fuji Pro 400H",
        camera: "Mamiya 7",
        collectionTag: "Rockies",
        previewImageUrl: "https://picsum.photos/seed/alpine/900/700",
        fullResFileUrl: "https://placeholder.lucyevans.com/full/high-alpine-still.tif",
        price: 3500,
      },
    }),
    prisma.photo.upsert({
      where: { slug: "winter-coast-dusk" },
      update: {},
      create: {
        title: "Winter Coast Dusk",
        slug: "winter-coast-dusk",
        description: "Pacific winter storms produce the best dramatic light — moody, cold, completely unpredictable.",
        location: "Cannon Beach, Oregon",
        captureDate: new Date("2024-01-18"),
        filmStock: "Ilford HP5 Plus",
        camera: "Nikon F3",
        collectionTag: "Pacific Northwest",
        previewImageUrl: "https://picsum.photos/seed/coastdusk/800/1000",
        fullResFileUrl: "https://placeholder.lucyevans.com/full/winter-coast-dusk.tif",
        price: 3000,
        isLimitedEdition: true,
        editionSize: 15,
        editionSold: 3,
      },
    }),
  ]);

  // ── Bundles ───────────────────────────────────────────────────────
  await prisma.bundle.upsert({
    where: { slug: "pacific-northwest-collection" },
    update: {},
    create: {
      title: "Pacific Northwest Collection",
      slug: "pacific-northwest-collection",
      description: "Three landscapes from Oregon and Washington — golden hour at the gorge, fog on Crater Lake, and the winter coast. Includes all full-resolution files.",
      price: 9000,
      featured: true,
      photos: {
        create: [
          { photoId: photos[0].id },
          { photoId: photos[1].id },
          { photoId: photos[5].id },
        ],
      },
    },
  });

  await prisma.bundle.upsert({
    where: { slug: "wide-open-west" },
    update: {},
    create: {
      title: "Wide Open West",
      slug: "wide-open-west",
      description: "Salt flats, alpine lakes, desert horizons. The big landscapes of the American interior on medium format film.",
      price: 10000,
      photos: {
        create: [
          { photoId: photos[2].id },
          { photoId: photos[4].id },
        ],
      },
    },
  });

  // ── Service packages ──────────────────────────────────────────────
  await prisma.servicePackage.upsert({
    where: { id: "pkg-elopement" },
    update: {},
    create: {
      id: "pkg-elopement",
      name: "Elopement",
      description: "Intimate coverage for two. One roll of film, 36 scanned images, delivered in 3 weeks.",
      rollsIncluded: 1,
      photosIncluded: 36,
      basePrice: 80000,
      eventTypes: ["elopement"],
      addOnPricing: { extraRollPrice: 15000, rushDeliveryPrice: 20000, secondShooterPrice: 0 },
    },
  });

  await prisma.servicePackage.upsert({
    where: { id: "pkg-portrait" },
    update: {},
    create: {
      id: "pkg-portrait",
      name: "Portrait Session",
      description: "2-hour session, 2 rolls of film, 60–70 scanned images. Great for individuals, couples, and families.",
      rollsIncluded: 2,
      photosIncluded: 70,
      basePrice: 60000,
      eventTypes: ["portrait"],
      addOnPricing: { extraRollPrice: 15000, rushDeliveryPrice: 20000, secondShooterPrice: 0 },
    },
  });

  await prisma.servicePackage.upsert({
    where: { id: "pkg-event" },
    update: {},
    create: {
      id: "pkg-event",
      name: "Event Coverage",
      description: "Half-day event coverage. 3 rolls, 100+ scanned images. Ideal for engagement parties, brand events, and celebrations.",
      rollsIncluded: 3,
      photosIncluded: 100,
      basePrice: 120000,
      eventTypes: ["event"],
      addOnPricing: { extraRollPrice: 15000, rushDeliveryPrice: 20000, secondShooterPrice: 40000 },
    },
  });

  await prisma.servicePackage.upsert({
    where: { id: "pkg-wedding-essential" },
    update: {},
    create: {
      id: "pkg-wedding-essential",
      name: "Wedding — Essential",
      description: "Full wedding day, 6 hours, 5 rolls, 150–180 scanned images. No second shooter.",
      rollsIncluded: 5,
      photosIncluded: 180,
      basePrice: 250000,
      eventTypes: ["wedding"],
      addOnPricing: { extraRollPrice: 15000, rushDeliveryPrice: 30000, secondShooterPrice: 80000 },
    },
  });

  await prisma.servicePackage.upsert({
    where: { id: "pkg-wedding-full" },
    update: {},
    create: {
      id: "pkg-wedding-full",
      name: "Wedding — Full Day",
      description: "10-hour full wedding day, 8 rolls, 250+ scanned images, second shooter included.",
      rollsIncluded: 8,
      photosIncluded: 250,
      basePrice: 400000,
      eventTypes: ["wedding"],
      addOnPricing: { extraRollPrice: 15000, rushDeliveryPrice: 30000, secondShooterPrice: 0 },
    },
  });

  // ── Portfolio pieces ───────────────────────────────────────────────
  await prisma.portfolioPiece.upsert({
    where: { slug: "lune-cosmetics-launch" },
    update: {},
    create: {
      title: "Lune Cosmetics — Product Launch Campaign",
      slug: "lune-cosmetics-launch",
      brandName: "Lune Cosmetics",
      role: "Content Strategist & Video Creator",
      description: "Developed and produced a 6-video TikTok launch series for Lune's new dewy skin line targeting Gen Z. Led creative direction, scripting, and post-production for all deliverables.",
      deliverables: "6 TikTok videos, 6 matching Reels, caption copy, hashtag strategy, 3-week posting calendar",
      metrics: "4.2M combined views, 380K saves, 18% avg engagement rate, #1 trending sound on TikTok for 48 hrs",
      videoUrls: ["https://res.cloudinary.com/placeholder/video/upload/lune-launch-1.mp4"],
      originalPostUrls: ["https://tiktok.com/@placeholder/1"],
      coverImageUrl: "https://picsum.photos/seed/lune/900/600",
      tags: ["beauty", "product launch", "TikTok", "Gen Z"],
      dateCompleted: new Date("2024-03-01"),
      testimonialQuote: "Lucy took our brief and turned it into something we couldn't have imagined. The engagement numbers speak for themselves.",
      testimonialAuthor: "Sofia Ramirez, Head of Social — Lune Cosmetics",
      featured: true,
    },
  });

  await prisma.portfolioPiece.upsert({
    where: { slug: "fieldstone-coffee-brand" },
    update: {},
    create: {
      title: "Fieldstone Coffee — Brand Storytelling Series",
      slug: "fieldstone-coffee-brand",
      brandName: "Fieldstone Coffee",
      role: "Content Creator & Photographer",
      description: "Created an ongoing monthly short-form series documenting the origin stories of Fieldstone's single-origin beans. Combined film photography stills with vertical video for cross-platform use.",
      deliverables: "12 Reels (monthly, over 12 months), 36 film photography stills, caption copy",
      metrics: "220K new followers gained over campaign period, avg Reel reach 85K, 3x increase in website traffic from social",
      videoUrls: ["https://res.cloudinary.com/placeholder/video/upload/fieldstone-1.mp4"],
      originalPostUrls: ["https://instagram.com/p/placeholder"],
      coverImageUrl: "https://picsum.photos/seed/fieldstone/900/600",
      tags: ["food & beverage", "brand storytelling", "Instagram Reels", "photography"],
      dateCompleted: new Date("2024-06-01"),
      testimonialQuote: "The film photography gave our content a warmth that felt completely on-brand. Our audience noticed the difference immediately.",
      testimonialAuthor: "James Park, Founder — Fieldstone Coffee",
      featured: true,
    },
  });

  await prisma.portfolioPiece.upsert({
    where: { slug: "volta-activewear-ugc" },
    update: {},
    create: {
      title: "Volta Activewear — UGC & Creator Campaign",
      slug: "volta-activewear-ugc",
      brandName: "Volta Activewear",
      role: "UGC Creator & Creative Strategist",
      description: "Produced 10 UGC-style videos for Volta's paid social channels, each testing a different hook and messaging angle. Delivered performance data analysis and creative iteration recommendations.",
      deliverables: "10 UGC videos, performance report, creative brief for next quarter",
      metrics: "Best-performing ad achieved $0.08 CPC, 4.5% CTR — 3x above brand's previous benchmarks",
      videoUrls: ["https://res.cloudinary.com/placeholder/video/upload/volta-1.mp4"],
      originalPostUrls: [],
      coverImageUrl: "https://picsum.photos/seed/volta/900/600",
      tags: ["activewear", "UGC", "paid social", "TikTok ads"],
      dateCompleted: new Date("2024-09-01"),
    },
  });

  // ── Newsletter subscriber (demo) ───────────────────────────────────
  await prisma.subscriber.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: { email: "demo@example.com", source: "seed", confirmed: true },
  });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
