import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const locales = ["fr", "en"] as const;

const resolveLocale = async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale as (typeof locales)[number])) {
    return cookieLocale;
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language") ?? "";
  const accepted = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter(Boolean) as string[];

  for (const entry of accepted) {
    const base = entry.split("-")[0];
    if (locales.includes(base as (typeof locales)[number])) {
      return base;
    }
  }

  return "fr";
};

export default getRequestConfig(async () => {
  const resolvedLocale = await resolveLocale();

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default,
  };
});
