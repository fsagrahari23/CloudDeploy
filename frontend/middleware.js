import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const protectedPaths = ["/dashboard", "/projects"];
  if (!protectedPaths.some((p) => pathname.startsWith(p))) return NextResponse.next();

  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const signin = new URL("/api/auth/signin", req.url);
      signin.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signin);
    }
    return NextResponse.next();
  } catch (e) {
    const signin = new URL("/api/auth/signin", req.url);
    signin.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signin);
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*"],
};
