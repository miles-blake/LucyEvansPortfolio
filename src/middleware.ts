import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!session || role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  if (
    pathname.startsWith("/account") &&
    pathname !== "/account/login" &&
    pathname !== "/account/register"
  ) {
    if (!session || role !== "client") {
      return NextResponse.redirect(new URL("/account/login", req.url));
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
