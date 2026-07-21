import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Sets the preview cookie and redirects to the homepage.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.redirect(new URL("/admin/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));

  const res = NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
  res.cookies.set("lep_preview", "1", {
    httpOnly: false, // needs to be readable client-side for the exit button
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4, // 4 hours
  });
  return res;
}

// Clears the preview cookie and redirects back to admin.
export async function DELETE() {
  const res = NextResponse.redirect(new URL("/admin", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
  res.cookies.set("lep_preview", "", { path: "/", maxAge: 0 });
  return res;
}
