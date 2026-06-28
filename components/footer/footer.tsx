import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { localizedPath } from "@/lib/i18n-routing";
import LanguageSwitcher from "./language-switcher";

export default async function Footer() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("footer"),
  ]);
  const productLinks = [
    { href: "/features/time-tracking", label: t("links.timeTracking") },
    { href: "/features/facturation-freelance", label: t("links.invoicing") },
    { href: "/features/qr-facture-suisse", label: t("links.qrBill") },
    { href: "/use-cases/freelances", label: t("links.freelancers") },
  ];
  const resourceLinks = [
    { href: "/", label: t("links.home") },
    { href: "/pricing", label: t("links.pricing") },
    { href: "/blog", label: t("links.blog") },
    { href: "/compare/excel", label: t("links.excelCompare") },
    { href: "/about", label: t("links.about") },
    { href: "/contact", label: t("links.contact") },
  ];
  const trustLinks = [
    { href: "/legal/privacy", label: t("links.privacy") },
    { href: "/legal/terms", label: t("links.terms") },
    { href: "/auth/login", label: t("links.login") },
  ];

  return (
    <footer className="w-full border-t border-black/5 bg-white/70">
      <div className="mx-auto w-full maxW px-6 py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.3fr_0.9fr_0.9fr_0.8fr_0.7fr]">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Kronoma</p>
            <p className="mt-3 text-sm text-neutral-600">{t("tagline")}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-neutral-500">
              {t("productTitle")}
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-neutral-600">
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  href={localizedPath(link.href, locale)}
                  className="transition hover:text-neutral-900"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase text-neutral-500">
              {t("linksTitle")}
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-neutral-600">
              {resourceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={localizedPath(link.href, locale)}
                  className="transition hover:text-neutral-900"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase text-neutral-500">
              {t("trustTitle")}
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-neutral-600">
              {trustLinks.map((link) => (
                <Link
                  key={link.href}
                  href={localizedPath(link.href, locale)}
                  className="transition hover:text-neutral-900"
                >
                  {link.label}
                </Link>
              ))}
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
