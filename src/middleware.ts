import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/accept-invite",
  "/forgot-password",
  "/reset-password",
  "/invite",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets and next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const isAuthRoute = AUTH_ROUTES.has(pathname) ||
    Array.from(AUTH_ROUTES).some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`));

  const token = request.cookies.get("token")?.value;

  // If visiting auth routes while logged in, redirect to dashboard
  if (isAuthRoute && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Protect non-auth routes
  if (!isAuthRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};


