import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://lucyevans.com";

  const [photos, bundles, portfolio] = await Promise.all([
    prisma.photo.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.bundle.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.portfolioPiece.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/gallery`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/bundles`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/services/book`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/work`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/media-kit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/license`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const photoRoutes: MetadataRoute.Sitemap = photos.map((p) => ({
    url: `${base}/gallery/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const bundleRoutes: MetadataRoute.Sitemap = bundles.map((b) => ({
    url: `${base}/bundles/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const portfolioRoutes: MetadataRoute.Sitemap = portfolio.map((p) => ({
    url: `${base}/work/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...photoRoutes, ...bundleRoutes, ...portfolioRoutes];
}
