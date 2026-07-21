import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import { signPreviewReturnToken, verifyPreviewReturnToken } from "@/lib/preview-token";
import bcrypt from "bcryptjs";

const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

const RETURN_COOKIE = "lep_return";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

async function makeSessionToken(user: {
  id: string;
  name: string;
  email: string;
  isTestClient: boolean;
}) {
  return encode({
    token: { sub: user.id, id: user.id, name: user.name, email: user.email, isTestClient: user.isTestClient },
    secret: process.env.NEXTAUTH_SECRET!,
    salt: SESSION_COOKIE,
  });
}

// GET /api/admin/preview → switch from admin → test client
export async function GET() {
  const session = await auth();
  if (!session || session.user.isTestClient) {
    return NextResponse.redirect(new URL("/admin/login", BASE_URL));
  }

  // Find or create the test client account
  let testClient = await prisma.adminUser.findFirst({ where: { isTestClient: true } });
  if (!testClient) {
    const placeholder = await bcrypt.hash(crypto.randomUUID(), 10);
    testClient = await prisma.adminUser.create({
      data: {
        name: "Preview Client",
        email: "preview@lucyevans.internal",
        hashedPassword: placeholder,
        isTestClient: true,
      },
    });
  }

  // Sign a return token so we can get back without re-entering password
  const returnToken = signPreviewReturnToken(session.user.id);

  // Build the test client JWT
  const jwt = await makeSessionToken({
    id: testClient.id,
    name: testClient.name,
    email: testClient.email,
    isTestClient: true,
  });

  const res = NextResponse.redirect(new URL("/", BASE_URL));
  res.cookies.set(RETURN_COOKIE, returnToken, sessionCookieOptions(4 * 60 * 60));
  res.cookies.set(SESSION_COOKIE, jwt, sessionCookieOptions(4 * 60 * 60));
  return res;
}

// GET /api/admin/preview?return=1 → switch back from test client → admin
export async function POST(req: NextRequest) {
  const returnToken = req.cookies.get(RETURN_COOKIE)?.value;
  if (!returnToken) return NextResponse.redirect(new URL("/admin/login", BASE_URL));

  const verified = verifyPreviewReturnToken(returnToken);
  if (!verified) return NextResponse.redirect(new URL("/admin/login", BASE_URL));

  const admin = await prisma.adminUser.findUnique({
    where: { id: verified.adminId, isTestClient: false },
  });
  if (!admin) return NextResponse.redirect(new URL("/admin/login", BASE_URL));

  const jwt = await makeSessionToken({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    isTestClient: false,
  });

  const res = NextResponse.redirect(new URL("/admin", BASE_URL));
  res.cookies.set(SESSION_COOKIE, jwt, sessionCookieOptions(30 * 24 * 60 * 60));
  res.cookies.delete(RETURN_COOKIE);
  return res;
}
