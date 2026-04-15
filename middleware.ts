import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "turnohotel_session";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/me",
  "/api/auth/logout",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}

function isPublicApiPath(pathname: string) {
  return PUBLIC_API_PATHS.includes(pathname);
}

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public") ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt)$/.test(pathname)
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(sessionToken);

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "No autenticado." },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/turnos", request.url));
    }

    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    const next = `${pathname}${search}`;
    loginUrl.searchParams.set("next", next);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};