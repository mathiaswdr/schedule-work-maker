"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, Clock, Settings2 } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Clock, key: "time" },
  { href: "/dashboard/stats", icon: BarChart3, key: "stats" },
  { href: "/dashboard/settings", icon: Settings2, key: "settings" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: shouldReduceMotion ? 0 : -10 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <aside className="w-full lg:w-64">
      <motion.div
        className="sticky top-6 rounded-3xl border border-line bg-white/70 p-4 shadow-[0_24px_60px_-42px_rgba(15,118,110,0.35)]"
        variants={containerVariants}
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

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="block min-w-[180px] lg:min-w-0"
              >
                <motion.div
                  variants={itemVariants}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-line-strong bg-white text-ink shadow-[0_20px_40px_-32px_rgba(15,118,110,0.45)]"
                      : "border-transparent text-ink-muted hover:border-line hover:bg-white/60"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                      isActive ? "bg-brand/10 text-brand" : "bg-ink-soft text-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{t(`sidebar.${item.key}`)}</span>
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
  );
}
