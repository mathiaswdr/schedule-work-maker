"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LayoutDashboard } from "lucide-react";
import type { ExtendUser } from "@/next-auth";
import { scrollToSection } from "@/utils/tools";

const ANCHOR_SCROLL_OFFSET = -40;

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

type NavLinkItem = {
  href: string;
  label: string;
  sectionId?: string;
};

type NavClientProps = {
  user: ExtendUser | null;
  labels: {
    home: string;
    pricing: string;
    about: string;
    faq: string;
    login: string;
    trial: string;
    dashboard: string;
  };
};

export default function NavClient({ user, labels }: NavClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleAnchorClick = useCallback(
    (e: React.MouseEvent, pagePath: string, sectionId?: string) => {
      if (!sectionId) return;

      e.preventDefault();
      setMobileOpen(false);

      if (pathname === pagePath || (pagePath === "" && pathname === "/")) {
        scrollToSection(sectionId, ANCHOR_SCROLL_OFFSET);
        return;
      }

      router.push(pagePath || "/");

      const waitForElement = () => {
        const el = document.getElementById(sectionId);

        if (el) {
          scrollToSection(sectionId, ANCHOR_SCROLL_OFFSET);
          return;
        }

        requestAnimationFrame(waitForElement);
      };

      setTimeout(waitForElement, 100);
    },
    [pathname, router],
  );

  const navLinks: NavLinkItem[] = [
    { href: "/", label: labels.home },
    { href: "/pricing", label: labels.pricing },
    { href: "/about", label: labels.about },
    { href: "/", label: labels.faq, sectionId: "faq" },
  ];

  return (
    <>
      <nav className="fixed top-0 z-50 w-full">
        <div className="mx-auto flex w-full maxW items-center justify-between px-6 py-4">
          <div className="flex w-full items-center justify-between rounded-full border border-line bg-panel px-5 py-2.5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
            <Link
              href="/"
              aria-label="Kronoma"
              className={`${cormorantGaramond.className} text-[1.7rem] font-bold leading-none tracking-[-0.04em] text-neutral-900 antialiased sm:text-[1.85rem]`}
            >
              <span>Kronoma</span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const isActive = !link.sectionId && pathname === link.href;

                return (
                  <Link
                    key={`${link.href}-${link.sectionId ?? "page"}`}
                    href={link.href}
                    onClick={(e) => handleAnchorClick(e, link.href, link.sectionId)}
                    className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-neutral-900"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    {isActive ? (
                      <span className="absolute inset-0 rounded-full bg-neutral-900/[0.06]" />
                    ) : null}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              {!user ? (
                <>
                  <Link
                    href="/auth/login"
                    className="rounded-full px-4 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    {labels.login}
                  </Link>
                  <Link
                    href="/auth/login"
                    className="rounded-full bg-neutral-900 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                  >
                    {labels.trial}
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-full bg-brand px-5 py-1.5 text-sm font-semibold text-white shadow-[0_4px_12px_-2px_rgba(249,115,22,0.5)] transition-all hover:translate-y-[-1px] hover:shadow-[0_6px_16px_-2px_rgba(249,115,22,0.6)]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {labels.dashboard}
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-5 w-5 text-neutral-700" />
              ) : (
                <Menu className="h-5 w-5 text-neutral-700" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setMobileOpen(false)}
          />

          <div className="fixed left-4 right-4 top-[88px] z-50 overflow-hidden rounded-3xl border border-line bg-panel shadow-[0_12px_40px_-8px_rgba(0,0,0,0.1)] md:hidden">
            <div className="p-2">
              {navLinks.map((link) => {
                const isActive = !link.sectionId && pathname === link.href;

                return (
                  <Link
                    key={`${link.href}-${link.sectionId ?? "page"}`}
                    href={link.href}
                    onClick={(e) => {
                      handleAnchorClick(e, link.href, link.sectionId);
                      if (!link.sectionId) setMobileOpen(false);
                    }}
                    className={`flex items-center rounded-2xl px-4 py-3 text-[15px] font-medium transition-colors ${
                      isActive
                        ? "bg-neutral-900/[0.06] text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="mx-3 my-2 h-px bg-neutral-200/60" />

              {!user ? (
                <div className="flex flex-col gap-2 p-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    {labels.login}
                  </Link>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                  >
                    {labels.trial}
                  </Link>
                </div>
              ) : (
                <div className="p-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_-2px_rgba(249,115,22,0.5)] transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {labels.dashboard}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
