import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

// Returns null if rate limiting is not configured (no Upstash env vars).
// Always returns null in development so the DX is not affected.
function makeRatelimiter(requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  if (
    process.env.NODE_ENV !== "production" ||
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
  });
}

// Per-endpoint limiters
const limiters = {
  booking:    makeRatelimiter(3,  "1 h"),  // 3 booking attempts per IP per hour
  newsletter: makeRatelimiter(3,  "1 h"),  // 3 signup attempts per IP per hour
  contact:    makeRatelimiter(5,  "1 h"),  // 5 contact form submissions per IP per hour
  discount:   makeRatelimiter(20, "1 m"),  // 20 code lookups per IP per minute
  register:   makeRatelimiter(5,  "1 h"),  // 5 registration attempts per IP per hour
};

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function rateLimit(
  req: NextRequest,
  endpoint: keyof typeof limiters
): Promise<{ limited: boolean; resetAt?: number }> {
  const limiter = limiters[endpoint];
  if (!limiter) return { limited: false };

  const ip = getIp(req);
  const { success, reset } = await limiter.limit(ip);
  return { limited: !success, resetAt: reset };
}
