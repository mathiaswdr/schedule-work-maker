import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "./language-switcher";

export default async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="w-full border-t border-black/5 bg-white/70">
      <div className="mx-auto w-full maxW px-6 py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Kronoma</p>
            <p className="mt-3 text-sm text-neutral-600">{t("tagline")}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-neutral-500">
              {t("linksTitle")}
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-neutral-600">
              <Link href="/" className="transition hover:text-neutral-900">
                {t("links.home")}
              </Link>
              <Link
                href="/pricing"
                className="transition hover:text-neutral-900"
              >
                {t("links.pricing")}
              </Link>
              <Link href="/about" className="transition hover:text-neutral-900">
                {t("links.about")}
              </Link>
              <Link
                href="/auth/login"
                className="transition hover:text-neutral-900"
              >
                {t("links.login")}
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase text-neutral-500">
              {t("languageLabel")}
            </p>
            <div className="mt-3">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
        <div className="mt-8 text-xs text-neutral-400">{t("copy")}</div>
      </div>
    </footer>
  );
}
