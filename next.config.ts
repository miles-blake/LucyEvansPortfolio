import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Prisma (and bcryptjs) from being bundled into the client — they use Node built-ins
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
  images: {
    remotePatterns: [
      // Placeholder images (dev only — swap for Cloudinary in production)
      { protocol: "https", hostname: "picsum.photos" },
      // Cloudinary (production)
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
