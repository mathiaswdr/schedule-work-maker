import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  internalPathnameFromLocalized,
  isAppLocale,
  localeCookieName,
  localeHeaderName,
  localizedPath,
  shouldLocalePrefixPath,
} from "@/lib/i18n-routing";

const oneYear = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (isAppLocale(maybeLocale)) {
    const localizedPathname =
      `/${segments.slice(2).join("/")}`.replace(/\/+$/, "") || "/";
    const internalPathname = internalPathnameFromLocalized(
      localizedPathname,
      maybeLocale,
    );
    const canonicalPathname = localizedPath(internalPathname, maybeLocale);

    if (canonicalPathname !== pathname) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = canonicalPathname;
      const response = NextResponse.redirect(redirectUrl, 308);
      response.cookies.set(localeCookieName, maybeLocale, {
        path: "/",
        maxAge: oneYear,
        sameSite: "lax",
      });
      return response;
    }

    const rewrittenUrl = request.nextUrl.clone();
    rewrittenUrl.pathname = internalPathname;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(localeHeaderName, maybeLocale);

    const response = NextResponse.rewrite(rewrittenUrl, {
      request: {
        headers: requestHeaders,
      },
    });
    response.cookies.set(localeCookieName, maybeLocale, {
      path: "/",
      maxAge: oneYear,
      sameSite: "lax",
    });

    return response;
  }

  if (shouldLocalePrefixPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localizedPath(pathname, defaultLocale);
    return NextResponse.redirect(redirectUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
