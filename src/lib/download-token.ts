import { createHmac, timingSafeEqual } from "crypto";

function secret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET not set");
  return s;
}

export function signDownloadToken(orderItemId: string): string {
  return createHmac("sha256", secret()).update(orderItemId).digest("hex");
}

export function verifyDownloadToken(orderItemId: string, token: string): boolean {
  try {
    const expected = signDownloadToken(orderItemId);
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}
