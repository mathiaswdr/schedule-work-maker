"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BarChart3, Clock, CreditCard, Ellipsis, FileText, FolderKanban, History, Receipt, Settings2, Users } from "lucide-react";
import { pickVariants } from "@/lib/motion-variants";
import { type PlanId, type FeatureKey, FEATURE_PLAN_MAP, isPlanSufficient } from "@/lib/plans";

const navItems: { href: string; icon: typeof Clock; key: FeatureKey }[] = [
  { href: "/dashboard", icon: Clock, key: "time" },
  { href: "/dashboard/sessions", icon: History, key: "sessions" },
  { href: "/dashboard/clients", icon: Users, key: "clients" },
  { href: "/dashboard/projects", icon: FolderKanban, key: "projects" },
  { href: "/dashboard/invoices", icon: FileText, key: "invoices" },
  { href: "/dashboard/expenses", icon: Receipt, key: "expenses" },
  { href: "/dashboard/stats", icon: BarChart3, key: "stats" },
  { href: "/dashboard/subscription", icon: CreditCard, key: "subscription" },
  { href: "/dashboard/settings", icon: Settings2, key: "settings" },
];

const mobileMainItems = navItems.slice(0, 4);
const mobileMoreItems = navItems.slice(4);

function PlanBadge({ requiredPlan }: { requiredPlan: PlanId }) {
  return (
    <span className="ml-auto rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold leading-none text-brand">
      {requiredPlan === "PRO" ? "Pro" : "Starter"}
    </span>
  );
}

export default function DashboardSidebar({ userPlan }: { userPlan: PlanId }) {
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const shouldReduceMotion = useReducedMotion();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = mobileMoreItems.some((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
  );

  const v = pickVariants(shouldReduceMotion);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const isLocked = (key: FeatureKey) => {
    const required = FEATURE_PLAN_MAP[key];
    return !isPlanSufficient(userPlan, required);
  };

  return (
    <>
      {/* ========== DESKTOP SIDEBAR ========== */}
      <aside className="hidden w-64 lg:block">
        <motion.div
          className="sticky top-6 rounded-3xl border border-line bg-white/70 p-4 shadow-[0_24px_60px_-42px_rgba(15,118,110,0.35)]"
          variants={v.sidebarContainer}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">
                {t("sidebar.subtitle")}
              </p>
              <p className="text-lg font-semibold text-ink">
                {t("sidebar.title")}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-white text-sm font-semibold text-brand">
              TW
            </div>
          </div>

          <nav className="mt-5 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const locked = isLocked(item.key);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className="block"
                >
                  <motion.div
                    variants={v.sidebarItem}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "border-line-strong bg-white text-ink shadow-[0_20px_40px_-32px_rgba(15,118,110,0.45)]"
                        : "border-transparent text-ink-muted hover:border-line hover:bg-white/60"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                        active ? "bg-brand/10 text-brand" : "bg-ink-soft text-ink"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{t(`sidebar.${item.key}`)}</span>
                    {locked && <PlanBadge requiredPlan={FEATURE_PLAN_MAP[item.key]} />}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-line bg-white/80 px-4 py-3 text-xs text-ink-muted">
            {t("sidebar.hint")}
          </div>
        </motion.div>
      </aside>

      {/* ========== MOBILE BOTTOM NAV (iOS 26 glassy) ========== */}
      <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        {/* More popover */}
        <AnimatePresence>
          {moreOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="more-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40"
                onClick={() => setMoreOpen(false)}
              />
              {/* Popover */}
              <motion.div
                key="more-popover"
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-full right-4 z-50 mb-2 min-w-[180px] overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)]"
              >
                {mobileMoreItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const locked = isLocked(item.key);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                        active
                          ? "bg-brand/10 text-brand"
                          : "text-ink-muted hover:bg-brand/5 hover:text-ink"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${active ? "text-brand" : ""}`}
                      />
                      <span>{t(`sidebar.${item.key}`)}</span>
                      {locked && <PlanBadge requiredPlan={FEATURE_PLAN_MAP[item.key]} />}
                    </Link>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Nav bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="flex items-center justify-around rounded-full border border-line bg-panel px-1 py-1 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)]"
        >
          {mobileMainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="relative flex flex-1 flex-col items-center justify-center py-2"
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 m-0.5 rounded-full bg-brand/10 shadow-[0_2px_12px_-4px_rgba(249,115,22,0.25)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center gap-0.5">
                  <Icon
                    className={`h-[18px] w-[18px] transition-colors ${
                      active ? "text-brand" : "text-ink-muted/70"
                    }`}
                  />
                  <span
                    className={`text-[9px] font-semibold leading-none tracking-wide transition-colors ${
                      active ? "text-brand" : "text-ink-muted/60"
                    }`}
                  >
                    {t(`sidebar.${item.key}`)}
                  </span>
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setMoreOpen((prev) => !prev)}
            className="relative flex flex-1 flex-col items-center justify-center py-2"
          >
            {(isMoreActive && !moreOpen) && (
              <motion.div
                layoutId="mobile-nav-active"
                className="absolute inset-0 m-0.5 rounded-full bg-brand/10 shadow-[0_2px_12px_-4px_rgba(249,115,22,0.25)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex flex-col items-center gap-0.5">
              <Ellipsis
                className={`h-[18px] w-[18px] transition-colors ${
                  isMoreActive || moreOpen ? "text-brand" : "text-ink-muted/70"
                }`}
              />
              <span
                className={`text-[9px] font-semibold leading-none tracking-wide transition-colors ${
                  isMoreActive || moreOpen ? "text-brand" : "text-ink-muted/60"
                }`}
              >
                {t("sidebar.more")}
              </span>
            </span>
          </button>
        </motion.div>
      </nav>
    </>
  );
}
