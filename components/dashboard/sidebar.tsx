"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  ChevronDown,
  Clock,
  CreditCard,
  Ellipsis,
  FileText,
  FolderKanban,
  History,
  LogOut,
  Receipt,
  Settings2,
  Users,
} from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { markDashboardNavigationStart } from "@/lib/perf-metrics";
import {
  type PlanId,
  type FeatureKey,
  FEATURE_PLAN_MAP,
  getPlanDisplayName,
  isPlanSufficient,
} from "@/lib/plans";

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
const statsChildren = [
  { href: "/dashboard/stats/productivity", labelKey: "statsProductivity" },
  { href: "/dashboard/stats/billing", labelKey: "statsBilling" },
] as const;

type SidebarLabels = {
  subtitle: string;
  title: string;
  hint: string;
  more: string;
  signOut: string;
  signOutConfirmTitle: string;
  signOutConfirmDescription: string;
  cancel: string;
  items: Record<FeatureKey | "statsProductivity" | "statsBilling", string>;
};

function PlanBadge({ requiredPlan }: { requiredPlan: PlanId }) {
  return (
    <span className="ml-auto rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold leading-none text-brand">
      {getPlanDisplayName(requiredPlan)}
    </span>
  );
}

export default function DashboardSidebar({
  userPlan,
  labels,
}: {
  userPlan: PlanId;
  labels: SidebarLabels;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(pathname.startsWith("/dashboard/stats"));
  const [mobileStatsOpen, setMobileStatsOpen] = useState(
    pathname.startsWith("/dashboard/stats"),
  );
  const { confirm, ConfirmDialogElement } = useConfirm();
  const isStatsSectionActive = pathname.startsWith("/dashboard/stats");

  useEffect(() => {
    if (!isStatsSectionActive) return;

    setStatsOpen(true);
    setMobileStatsOpen(true);
  }, [isStatsSectionActive]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const isMoreActive = mobileMoreItems.some((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href),
  );

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const isLocked = (key: FeatureKey) => {
    const required = FEATURE_PLAN_MAP[key];
    return !isPlanSufficient(userPlan, required);
  };

  const handleSignOut = async () => {
    const confirmed = await confirm({
      title: labels.signOutConfirmTitle,
      description: labels.signOutConfirmDescription,
      confirmLabel: labels.signOut,
      cancelLabel: labels.cancel,
      variant: "default",
    });

    if (!confirmed) return;

    await signOut({ callbackUrl: "/" });
  };

  const handleNavigate = (href: string) => {
    markDashboardNavigationStart(href);
  };

  return (
    <>
      {ConfirmDialogElement}

      <aside className="hidden w-64 lg:block">
        <div className="sticky top-6 rounded-3xl border border-line bg-white/70 p-4 shadow-[0_24px_60px_-42px_rgba(15,118,110,0.35)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase text-ink-muted">{labels.subtitle}</p>
              <p className="text-lg font-semibold text-ink">{labels.title}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-white text-sm font-semibold text-brand">
              T
            </div>
          </div>

          <nav className="mt-5 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const locked = isLocked(item.key);

              if (item.key === "stats") {
                return (
                  <div key={item.href} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setStatsOpen((prev) => !prev)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                        isStatsSectionActive
                          ? "border-line-strong bg-white text-ink shadow-[0_20px_40px_-32px_rgba(15,118,110,0.45)]"
                          : "border-transparent text-ink-muted hover:border-line hover:bg-white/60"
                      }`}
                      aria-expanded={statsOpen}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                          isStatsSectionActive
                            ? "bg-brand/10 text-brand"
                            : "bg-ink-soft text-ink"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{labels.items[item.key]}</span>
                      {locked ? (
                        <PlanBadge requiredPlan={FEATURE_PLAN_MAP[item.key]} />
                      ) : null}
                      <ChevronDown
                        className={`ml-1 h-4 w-4 transition-transform ${
                          statsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {statsOpen ? (
                      <div className="space-y-2 overflow-hidden pl-4">
                        {statsChildren.map((child) => {
                          const childActive = pathname.startsWith(child.href);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => handleNavigate(child.href)}
                              className={`block rounded-2xl border px-3 py-2 text-sm transition ${
                                childActive
                                  ? "border-line-strong bg-white text-ink"
                                  : "border-transparent bg-white/50 text-ink-muted hover:border-line hover:bg-white/70"
                              }`}
                            >
                              {labels.items[child.labelKey]}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavigate(item.href)}
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
                  <span>{labels.items[item.key]}</span>
                  {locked ? <PlanBadge requiredPlan={FEATURE_PLAN_MAP[item.key]} /> : null}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-ink-muted transition hover:border-line hover:bg-white/60 hover:text-ink"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ink-soft text-ink">
                <LogOut className="h-4 w-4" />
              </span>
              <span>{labels.signOut}</span>
            </button>
          </nav>

          <div className="mt-6 rounded-2xl border border-line bg-white/80 px-4 py-3 text-xs text-ink-muted">
            {labels.hint}
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        {moreOpen ? (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
            <div className="absolute bottom-full right-4 z-50 mb-2 min-w-[180px] overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)]">
              {mobileMoreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const locked = isLocked(item.key);

                if (item.key === "stats") {
                  return (
                    <div key={item.href} className="border-t border-line/60 first:border-t-0">
                      <button
                        type="button"
                        onClick={() => setMobileStatsOpen((prev) => !prev)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                          isStatsSectionActive
                            ? "bg-brand/10 text-brand"
                            : "text-ink-muted hover:bg-brand/5 hover:text-ink"
                        }`}
                        aria-expanded={mobileStatsOpen}
                      >
                        <Icon className={`h-4 w-4 ${isStatsSectionActive ? "text-brand" : ""}`} />
                        <span>{labels.items[item.key]}</span>
                        {locked ? (
                          <PlanBadge requiredPlan={FEATURE_PLAN_MAP[item.key]} />
                        ) : null}
                        <ChevronDown
                          className={`ml-auto h-4 w-4 transition-transform ${
                            mobileStatsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {mobileStatsOpen ? (
                        <div className="overflow-hidden px-4 pb-3 pl-11">
                          <div className="space-y-2">
                            {statsChildren.map((child) => {
                              const childActive = pathname.startsWith(child.href);

                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => {
                                    handleNavigate(child.href);
                                    setMoreOpen(false);
                                  }}
                                  className={`block rounded-2xl px-3 py-2 text-sm transition-colors ${
                                    childActive
                                      ? "bg-brand/10 text-brand"
                                      : "text-ink-muted hover:bg-brand/5 hover:text-ink"
                                  }`}
                                >
                                  {labels.items[child.labelKey]}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      handleNavigate(item.href);
                      setMoreOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-brand/10 text-brand"
                        : "text-ink-muted hover:bg-brand/5 hover:text-ink"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-brand" : ""}`} />
                    <span>{labels.items[item.key]}</span>
                    {locked ? <PlanBadge requiredPlan={FEATURE_PLAN_MAP[item.key]} /> : null}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={async () => {
                  setMoreOpen(false);
                  await handleSignOut();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-ink-muted transition-colors hover:bg-brand/5 hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
                <span>{labels.signOut}</span>
              </button>
            </div>
          </>
        ) : null}

        <div className="flex items-center justify-around rounded-full border border-line bg-panel px-1 py-1 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)]">
          {mobileMainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNavigate(item.href)}
                className="relative flex flex-1 flex-col items-center justify-center py-2"
              >
                {active ? (
                  <span className="absolute inset-0 m-0.5 rounded-full bg-brand/10 shadow-[0_2px_12px_-4px_rgba(249,115,22,0.25)]" />
                ) : null}
                <span className="relative z-10 flex flex-col items-center gap-0.5">
                  <Icon
                    className={`h-[18px] w-[18px] transition-colors ${
                      active ? "text-brand" : "text-ink-muted/70"
                    }`}
                  />
                  <span
                    className={`text-[9px] font-semibold leading-none transition-colors ${
                      active ? "text-brand" : "text-ink-muted/60"
                    }`}
                  >
                    {labels.items[item.key]}
                  </span>
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((prev) => !prev)}
            className="relative flex flex-1 flex-col items-center justify-center py-2"
            aria-expanded={moreOpen}
          >
            {isMoreActive && !moreOpen ? (
              <span className="absolute inset-0 m-0.5 rounded-full bg-brand/10 shadow-[0_2px_12px_-4px_rgba(249,115,22,0.25)]" />
            ) : null}
            <span className="relative z-10 flex flex-col items-center gap-0.5">
              <Ellipsis
                className={`h-[18px] w-[18px] transition-colors ${
                  isMoreActive || moreOpen ? "text-brand" : "text-ink-muted/70"
                }`}
              />
              <span
                className={`text-[9px] font-semibold leading-none transition-colors ${
                  isMoreActive || moreOpen ? "text-brand" : "text-ink-muted/60"
                }`}
              >
                {labels.more}
              </span>
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
