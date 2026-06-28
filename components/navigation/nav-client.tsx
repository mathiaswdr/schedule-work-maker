"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { buildSignupCheckoutHref } from "@/lib/checkout-intent";
import { localizedPath, unlocalizedPath } from "@/lib/i18n-routing";
import type { ExtendUser } from "@/next-auth";
import { scrollToSection } from "@/utils/tools";

const ANCHOR_SCROLL_OFFSET = -96;

type NavLinkItem = {
  href: string;
  label: string;
  sectionId?: string;
};

type NavClientProps = {
  user: ExtendUser | null;
  labels: {
    home: string;
    features: string;
    pricing: string;
    blog: string;
    about: string;
    faq: string;
    login: string;
    trial: string;
    dashboard: string;
    menu: string;
  };
};

export default function NavClient({ user, labels }: NavClientProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoverPill, setHoverPill] = useState({ left: 0, width: 0 });
  const [hoverActive, setHoverActive] = useState(false);
  const activePathname = unlocalizedPath(pathname);

  const navLinks: NavLinkItem[] = [
    { href: "/", label: labels.home },
    { href: "/features/time-tracking", label: labels.features },
    { href: "/pricing", label: labels.pricing },
    { href: "/blog", label: labels.blog },
    { href: "/about", label: labels.about },
    { href: "/", label: labels.faq, sectionId: "faq" },
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const updateHoverPill = (element: HTMLElement) => {
    const container = navRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    setHoverPill({
      left: elementRect.left - containerRect.left,
      width: elementRect.width,
    });
    setHoverActive(true);
  };

  const handleNavBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setHoverActive(false);
  };

  const handleAnchorClick = (
    event: React.MouseEvent,
    pagePath: string,
    sectionId?: string,
  ) => {
    if (!sectionId) {
      setMobileOpen(false);
      return;
    }

    event.preventDefault();
    setMobileOpen(false);

    if (pathname === pagePath) {
      scrollToSection(sectionId, ANCHOR_SCROLL_OFFSET);
      return;
    }

    router.push(pagePath);

    const waitForElement = () => {
      if (document.getElementById(sectionId)) {
        scrollToSection(sectionId, ANCHOR_SCROLL_OFFSET);
        return;
      }

      requestAnimationFrame(waitForElement);
    };

    setTimeout(waitForElement, 100);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto w-full maxW px-4 py-4 sm:px-6">
        <nav className="relative rounded-[28px] border border-line bg-white/85 px-4 py-2.5 shadow-[0_14px_50px_-42px_rgba(29,27,22,0.7)] backdrop-blur-xl sm:rounded-full">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={localizedPath("/", locale)}
              aria-label="Kronoma"
              className="text-lg font-semibold text-ink"
              onClick={() => setMobileOpen(false)}
            >
              Kronoma
            </Link>

            <div
              ref={navRef}
              className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 xl:flex"
              onBlur={handleNavBlur}
              onMouseLeave={() => setHoverActive(false)}
            >
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 z-0 rounded-full bg-ink-soft shadow-[0_14px_30px_-24px_rgba(29,27,22,0.7)]"
                animate={{
                  filter: hoverActive ? "blur(0px)" : "blur(8px)",
                  left: hoverPill.left,
                  opacity: hoverActive ? 1 : 0,
                  scale: hoverActive ? 1 : 0.9,
                  width: hoverPill.width,
                }}
                initial={false}
                transition={{
                  filter: { duration: 0.18 },
                  left: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 0.16 },
                  scale: { duration: 0.18 },
                  width: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
                }}
              />

              {navLinks.map((link) => {
                const linkHref = localizedPath(link.href, locale);
                const isActive = !link.sectionId && activePathname === link.href;
                const className = `relative z-10 rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none xl:px-4 ${
                  isActive
                    ? "text-ink"
                    : "text-ink-muted hover:text-ink focus-visible:text-ink"
                }`;

                return (
                  <Link
                    key={`${link.href}-${link.sectionId ?? "page"}`}
                    href={linkHref}
                    className={className}
                    onClick={(event) =>
                      handleAnchorClick(event, linkHref, link.sectionId)
                    }
                    onFocus={(event) => updateHoverPill(event.currentTarget)}
                    onMouseEnter={(event) => updateHoverPill(event.currentTarget)}
                  >
                    {isActive ? (
                      <span className="absolute inset-0 rounded-full bg-ink-soft" />
                    ) : null}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <Button
                  asChild
                  className="group hidden h-10 rounded-full bg-brand px-4 text-white shadow-[0_12px_28px_-18px_rgba(249,115,22,0.95)] hover:bg-brand/90 xl:inline-flex"
                >
                  <Link href={localizedPath("/dashboard", locale)}>
                    {labels.dashboard}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    className="hidden rounded-full text-ink-muted hover:bg-ink-soft hover:text-ink xl:inline-flex"
                  >
                    <Link href={localizedPath("/auth/login", locale)}>
                      {labels.login}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="h-10 rounded-full bg-brand px-4 text-white shadow-[0_12px_28px_-18px_rgba(249,115,22,0.95)] hover:bg-brand/90"
                  >
                    <Link href={localizedPath(buildSignupCheckoutHref(), locale)}>
                      {labels.trial}
                    </Link>
                  </Button>
                </>
              )}

              <button
                type="button"
                aria-label={labels.menu}
                aria-expanded={mobileOpen}
                aria-controls="site-mobile-nav"
                onClick={() => setMobileOpen((current) => !current)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:bg-ink-soft xl:hidden"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div
            id="site-mobile-nav"
            className={`grid transition-[grid-template-rows,opacity] duration-200 xl:hidden ${
              mobileOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="mt-3 border-t border-line pt-3">
                <div className="grid gap-1">
                  {navLinks.map((link) => {
                    const linkHref = localizedPath(link.href, locale);
                    const isActive = !link.sectionId && activePathname === link.href;

                    return (
                      <Link
                        key={`${link.href}-${link.sectionId ?? "page"}`}
                        href={
                          link.sectionId ? `${linkHref}#${link.sectionId}` : linkHref
                        }
                        onClick={(event) =>
                          handleAnchorClick(event, linkHref, link.sectionId)
                        }
                        className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                          isActive
                            ? "bg-ink-soft text-ink"
                            : "text-ink-muted hover:bg-ink-soft hover:text-ink"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}

                  <div className="my-2 h-px bg-line" />

                  {user ? (
                    <Link
                      href={localizedPath("/dashboard", locale)}
                      onClick={() => setMobileOpen(false)}
                      className="group flex items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white"
                    >
                      {labels.dashboard}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={localizedPath("/auth/login", locale)}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-2xl px-4 py-3 text-sm font-medium text-ink-muted transition hover:bg-ink-soft hover:text-ink"
                      >
                        {labels.login}
                      </Link>
                      <Link
                        href={localizedPath(buildSignupCheckoutHref(), locale)}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white"
                      >
                        {labels.trial}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
