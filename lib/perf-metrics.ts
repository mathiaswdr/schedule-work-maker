type PendingDashboardNavigation = {
  href: string;
  startedAt: number;
};

let pendingDashboardNavigation: PendingDashboardNavigation | null = null;

export function markDashboardNavigationStart(href: string) {
  if (typeof performance === "undefined") {
    return;
  }

  pendingDashboardNavigation = {
    href,
    startedAt: performance.now(),
  };
}

export function consumeDashboardNavigationMetric(pathname: string) {
  if (!pendingDashboardNavigation || typeof performance === "undefined") {
    return null;
  }

  const { href, startedAt } = pendingDashboardNavigation;
  const matchesTarget =
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/dashboard/stats" && pathname.startsWith("/dashboard/stats"));

  if (!matchesTarget) {
    return null;
  }

  pendingDashboardNavigation = null;

  return {
    href,
    value: Number((performance.now() - startedAt).toFixed(2)),
  };
}
