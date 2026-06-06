import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const token = request.cookies.get("accessToken")?.value;
  if (request.nextUrl.pathname.startsWith("/admin") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
