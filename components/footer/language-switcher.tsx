"use client";

import type { ChangeEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import {
  localeCookieName,
  localeLabels,
  localizedPath,
  locales,
  shouldLocalePrefixPath,
  unlocalizedPath,
} from "@/lib/i18n-routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("footer");

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value;
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;

    const basePathname = unlocalizedPath(pathname);
    if (!shouldLocalePrefixPath(basePathname)) {
      window.location.reload();
      return;
    }

    const queryString = searchParams.toString();
    const targetPath = localizedPath(
      `${basePathname}${queryString ? `?${queryString}` : ""}`,
      nextLocale,
    );

    window.location.assign(targetPath);
  };

  return (
    <select
      aria-label={t("languageLabel")}
      className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
      value={locale}
      onChange={handleChange}
    >
      {locales.map((option) => (
        <option key={option} value={option}>
          {localeLabels[option]}
        </option>
      ))}
    </select>
  );
}
