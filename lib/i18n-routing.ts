export const locales = ["fr", "en"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "fr";
export const localeCookieName = "NEXT_LOCALE";
export const localeHeaderName = "x-kronoma-locale";

export const localeLabels: Record<AppLocale, string> = {
  fr: "Francais",
  en: "English",
};

export const localeMetadata: Record<
  AppLocale,
  { htmlLang: string; ogLocale: string }
> = {
  fr: { htmlLang: "fr", ogLocale: "fr_CH" },
  en: { htmlLang: "en", ogLocale: "en_US" },
};

const appOnlyPrefixes = [
  "/api",
  "/dashboard",
  "/_next",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/favicon.ico",
  "/apple-icon.png",
  "/icon-192.png",
  "/icon-512.png",
];

const publicPagePrefixes = [
  "/auth/login",
  "/auth/signup",
  "/landing",
  "/blog",
  "/pricing",
  "/about",
  "/features",
  "/use-cases",
  "/compare",
  "/contact",
  "/legal",
];

const localizedRoutePrefixes: Record<AppLocale, Record<string, string>> = {
  fr: {
    "/features/facturation-freelance": "/features/freelance-invoicing",
    "/features/qr-facture-suisse": "/features/swiss-qr-bill",
    "/use-cases/freelances": "/use-cases/freelancers",
  },
  en: {
    "/features/facturation-freelance": "/features/freelance-invoicing",
    "/features/qr-facture-suisse": "/features/swiss-qr-bill",
    "/use-cases/freelances": "/use-cases/freelancers",
  },
};

const legacyLocalizedRoutePrefixes: Record<AppLocale, Record<string, string>> = {
  fr: {
    "/tarifs": "/pricing",
    "/a-propos": "/about",
    "/fonctionnalites/suivi-du-temps": "/features/time-tracking",
    "/fonctionnalites/facturation-freelance": "/features/facturation-freelance",
    "/fonctionnalites/qr-facture-suisse": "/features/qr-facture-suisse",
    "/cas-usage/freelances": "/use-cases/freelances",
    "/comparatif/excel": "/compare/excel",
    "/legal/confidentialite": "/legal/privacy",
    "/legal/conditions": "/legal/terms",
  },
  en: {},
};

function normalizePathname(pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withoutTrailingSlash = normalized.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
}

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return locales.includes(value as AppLocale);
}

export function normalizeLocale(locale: string | undefined | null): AppLocale {
  return isAppLocale(locale) ? locale : defaultLocale;
}

export function splitLocalePath(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);
  const segments = normalizedPathname.split("/");
  const maybeLocale = segments[1];

  if (!isAppLocale(maybeLocale)) {
    return {
      locale: null,
      pathname: normalizedPathname,
    };
  }

  const strippedPathname = normalizePathname(`/${segments.slice(2).join("/")}`);

  return {
    locale: maybeLocale,
    pathname: strippedPathname,
  };
}

export function shouldLocalePrefixPath(pathname: string) {
  if (pathname === "/") return true;
  if (appOnlyPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }
  return publicPagePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function replaceRoutePrefix(
  pathname: string,
  routeMap: Record<string, string>,
) {
  const normalizedPathname = normalizePathname(pathname);
  const matchedPrefix = Object.keys(routeMap)
    .sort((a, b) => b.length - a.length)
    .find(
      (prefix) =>
        normalizedPathname === prefix ||
        normalizedPathname.startsWith(`${prefix}/`),
    );

  if (!matchedPrefix) return normalizedPathname;

  const replacement = routeMap[matchedPrefix];
  const suffix = normalizedPathname.slice(matchedPrefix.length);
  return normalizePathname(`${replacement}${suffix}`);
}

export function localizedRoutePathname(pathname: string, locale: string | null) {
  const normalizedLocale = normalizeLocale(locale);
  return replaceRoutePrefix(
    pathname,
    localizedRoutePrefixes[normalizedLocale],
  );
}

export function internalPathnameFromLocalized(
  pathname: string,
  locale: string | null,
) {
  const normalizedLocale = normalizeLocale(locale);
  const reverseMap = Object.entries(localizedRoutePrefixes[normalizedLocale]).reduce<
    Record<string, string>
  >((acc, [internalPath, localizedRoute]) => {
    acc[localizedRoute] = internalPath;
    return acc;
  }, {});

  return replaceRoutePrefix(pathname, {
    ...legacyLocalizedRoutePrefixes[normalizedLocale],
    ...reverseMap,
  });
}

export function localizedPath(path: string, locale: string | undefined | null) {
  if (!path || path.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(path)) {
    return path;
  }

  const normalizedLocale = normalizeLocale(locale);
  const [pathAndQuery, hash = ""] = path.split("#");
  const [pathname = "/", query = ""] = pathAndQuery.split("?");
  const { pathname: unprefixedPathname } = splitLocalePath(pathname || "/");
  const localizedPathname = localizedRoutePathname(
    unprefixedPathname,
    normalizedLocale,
  );

  if (!shouldLocalePrefixPath(unprefixedPathname)) {
    return path;
  }

  const localePath =
    localizedPathname === "/"
      ? `/${normalizedLocale}`
      : `/${normalizedLocale}${localizedPathname}`;
  const queryString = query ? `?${query}` : "";
  const hashString = hash ? `#${hash}` : "";

  return `${localePath}${queryString}${hashString}`;
}

export function unlocalizedPath(pathname: string) {
  const splitPath = splitLocalePath(pathname);
  return splitPath.locale
    ? internalPathnameFromLocalized(splitPath.pathname, splitPath.locale)
    : splitPath.pathname;
}
