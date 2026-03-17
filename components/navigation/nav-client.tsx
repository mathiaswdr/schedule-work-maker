"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LayoutDashboard } from "lucide-react";
import type { ExtendUser } from "@/next-auth";
import { scrollToSection } from "@/utils/tools";
import { EASE } from "@/lib/motion-variants";

// Offset en pixels pour le scroll vers les ancres (positif = plus bas, negatif = plus haut)
const ANCHOR_SCROLL_OFFSET = -40;

type NavLinkItem = {
  href: string;
  label: string;
  sectionId?: string;
};

type NavClientProps = {
  user: ExtendUser | null;
};

export default function NavClient({ user }: NavClientProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
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
      } else {
        router.push(pagePath || "/");
        const waitForElement = () => {
          const el = document.getElementById(sectionId);
          if (el) {
            scrollToSection(sectionId, ANCHOR_SCROLL_OFFSET);
          } else {
            requestAnimationFrame(waitForElement);
          }
        };
        setTimeout(waitForElement, 100);
      }
    },
    [pathname, router],
  );

  const navLinks: NavLinkItem[] = [
    { href: "/", label: t("home") },
    { href: "/pricing", label: t("pricing") },
    { href: "/about", label: t("about") },
    { href: "/", label: t("faq"), sectionId: "faq" },
  ];

  return (
    <>
      <nav className="fixed top-0 z-50 w-full">
        <div className="mx-auto flex w-full maxW items-center justify-between px-6 py-4">
          {/* Pill nav bar */}
          <div className="flex w-full items-center justify-between rounded-full border border-line bg-panel px-5 py-2.5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
            {/* Logo */}
            <Link
              href="/"
              className="text-lg font-bold text-neutral-900"
            >
              <span>Temiqo</span>
            </Link>

            {/* Desktop links */}
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
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-full bg-neutral-900/[0.06]"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA / User */}
            <div className="hidden items-center gap-2 md:flex">
              {!user ? (
                <>
                  <Link
                    href="/auth/login"
                    className="rounded-full px-4 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/auth/login"
                    className="rounded-full bg-neutral-900 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                  >
                    {t("trial")}
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-full bg-brand px-5 py-1.5 text-sm font-semibold text-white shadow-[0_4px_12px_-2px_rgba(249,115,22,0.5)] transition-all hover:translate-y-[-1px] hover:shadow-[0_6px_16px_-2px_rgba(249,115,22,0.6)]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("dashboard")}
                </Link>
              )}
            </div>

            {/* Mobile burger */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 md:hidden"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="h-5 w-5 text-neutral-700" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="h-5 w-5 text-neutral-700" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setMobileOpen(false)}
            />

            {/* Panel */}
            <motion.div
              key="nav-panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="fixed left-4 right-4 top-[88px] z-50 overflow-hidden rounded-3xl border border-line bg-panel shadow-[0_12px_40px_-8px_rgba(0,0,0,0.1)]"
            >
              <div className="p-2">
                {/* Nav links */}
                {navLinks.map((link, i) => {
                  const isActive = !link.sectionId && pathname === link.href;
                  return (
                    <motion.div
                      key={`${link.href}-${link.sectionId ?? "page"}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.25 }}
                    >
                      <Link
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
                    </motion.div>
                  );
                })}

                {/* Separator + CTA */}
                <div className="mx-3 my-2 h-px bg-neutral-200/60" />

                {!user ? (
                  <div className="flex flex-col gap-2 p-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                    >
                      {t("login")}
                    </Link>
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                    >
                      {t("trial")}
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
                      {t("dashboard")}
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
