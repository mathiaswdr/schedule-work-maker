"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LayoutDashboard } from "lucide-react";
import type { ExtendUser } from "@/next-auth";

// Offset en pixels pour le scroll vers les ancres (positif = plus bas, negatif = plus haut)
const ANCHOR_SCROLL_OFFSET = -40;

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

  const smoothScrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY + ANCHOR_SCROLL_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  const handleAnchorClick = useCallback(
    (e: React.MouseEvent, href: string) => {
      const [pagePath, hash] = href.split("#");
      if (!hash) return; // pas un lien ancre, laisser Next.js gerer

      e.preventDefault();
      setMobileOpen(false);

      if (pathname === pagePath || (pagePath === "" && pathname === "/")) {
        // Deja sur la bonne page, scroll direct
        smoothScrollTo(hash);
      } else {
        // Naviguer vers la page, puis scroll apres chargement
        router.push(pagePath || "/");
        const waitForElement = () => {
          const el = document.getElementById(hash);
          if (el) {
            smoothScrollTo(hash);
          } else {
            requestAnimationFrame(waitForElement);
          }
        };
        // Petit delai pour laisser la navigation commencer
        setTimeout(waitForElement, 100);
      }
    },
    [pathname, router, smoothScrollTo],
  );

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/pricing", label: t("pricing") },
    { href: "/about", label: t("about") },
    { href: "/#faq", label: t("faq") },
  ];

  return (
    <>
      <nav className="fixed top-0 z-50 w-full">
        <div className="mx-auto flex w-full maxW items-center justify-between px-6 py-4">
          {/* Pill nav bar */}
          <div className="flex w-full items-center justify-between rounded-full border border-white/50 bg-white/70 px-5 py-2.5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(255,255,255,0.7)_inset] backdrop-blur-lg">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-neutral-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">
                TW
              </span>
              <span className="hidden sm:inline">TempoWork</span>
            </Link>

            {/* Desktop links */}
            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleAnchorClick(e, link.href)}
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
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Panel */}
            <motion.div
              key="nav-panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-4 right-4 top-[88px] z-50 overflow-hidden rounded-3xl border border-white/50 bg-white/85 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(255,255,255,0.7)_inset] backdrop-blur-lg"
            >
              <div className="p-2">
                {/* Nav links */}
                {navLinks.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.25 }}
                    >
                      <Link
                        href={link.href}
                        onClick={(e) => {
                          handleAnchorClick(e, link.href);
                          if (!link.href.includes("#")) setMobileOpen(false);
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
