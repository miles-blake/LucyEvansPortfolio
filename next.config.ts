import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent browsers from guessing MIME types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block clickjacking — only this origin can frame the site
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Don't send referrer to third-party sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed by this site
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  // CSP: lock down where scripts/styles/images can load from
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Stripe (for Stripe.js) + Vercel analytics
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com",
      // Styles: self + inline (Tailwind generates inline styles)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + Cloudinary + picsum (dev) + Stripe hosted pages
      "img-src 'self' data: blob: https://res.cloudinary.com https://picsum.photos https://*.stripe.com",
      // Fonts: self only
      "font-src 'self'",
      // Frames: Stripe checkout only
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      // Connections: self + Stripe + Cloudinary + Upstash (rate limit)
      "connect-src 'self' https://api.stripe.com https://res.cloudinary.com https://*.upstash.io",
    ].join("; "),
  },
];

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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
