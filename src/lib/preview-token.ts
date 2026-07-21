import crypto from "crypto";

function secret() {
  return process.env.NEXTAUTH_SECRET ?? "dev-secret";
}

export function signPreviewReturnToken(adminId: string): string {
  const expires = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
  const payload = `${adminId}:${expires}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyPreviewReturnToken(token: string): { adminId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const lastColon = decoded.lastIndexOf(":");
    const sig = decoded.slice(lastColon + 1);
    const payload = decoded.slice(0, lastColon);
    const [adminId, expiresStr] = payload.split(":");
    if (!adminId || !expiresStr) return null;
    if (Date.now() > parseInt(expiresStr)) return null;
    const expected = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return { adminId };
  } catch {
    return null;
  }
}
