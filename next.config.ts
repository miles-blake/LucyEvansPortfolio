import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
