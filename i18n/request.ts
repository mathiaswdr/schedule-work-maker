import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  localeCookieName,
  localeHeaderName,
  locales,
  normalizeLocale,
} from "@/lib/i18n-routing";

const resolveLocale = async () => {
  const headerStore = await headers();
  const headerLocale = headerStore.get(localeHeaderName);
  if (headerLocale && locales.includes(headerLocale as (typeof locales)[number])) {
    return headerLocale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  if (cookieLocale && locales.includes(cookieLocale as (typeof locales)[number])) {
    return cookieLocale;
  }

  return normalizeLocale(null);
};

export default getRequestConfig(async () => {
  const resolvedLocale = await resolveLocale();

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default,
  };
});
