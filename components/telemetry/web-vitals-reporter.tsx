"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { consumeDashboardNavigationMetric } from "@/lib/perf-metrics";
import type { VitalsPayload } from "@/types/vitals";

type WebVitalsReporterProps = {
  locale: string;
};

type BrowserConnection = {
  effectiveType?: string;
};

type NextMetric = {
  name: string;
  value: number;
};

const TRACKED_WEB_VITALS = new Set(["LCP", "INP", "CLS"]);

function getViewportClass(): VitalsPayload["viewportClass"] {
  if (typeof window === "undefined") {
    return "desktop";
  }

  return window.matchMedia("(max-width: 1023px)").matches ? "mobile" : "desktop";
}

function getNetworkType() {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const connection = (navigator as Navigator & { connection?: BrowserConnection })
    .connection;

  return connection?.effectiveType ?? "unknown";
}

function sendVitals(payload: VitalsPayload) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(
      "/api/vitals",
      new Blob([body], { type: "application/json" }),
    );
    return;
  }

  void fetch("/api/vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export default function WebVitalsReporter({
  locale,
}: WebVitalsReporterProps) {
  const pathname = usePathname();

  useReportWebVitals((metric: NextMetric) => {
    if (!TRACKED_WEB_VITALS.has(metric.name)) {
      return;
    }

    sendVitals({
      metric: metric.name as VitalsPayload["metric"],
      value: Number(metric.value.toFixed(2)),
      pathname,
      viewportClass: getViewportClass(),
      networkType: getNetworkType(),
      locale,
      timestamp: Date.now(),
    });
  });

  useEffect(() => {
    if (!pathname.startsWith("/dashboard")) {
      return;
    }

    const metric = consumeDashboardNavigationMetric(pathname);

    if (!metric) {
      return;
    }

    sendVitals({
      metric: "DASHBOARD_TAB",
      value: metric.value,
      pathname,
      viewportClass: getViewportClass(),
      networkType: getNetworkType(),
      locale,
      timestamp: Date.now(),
    });
  }, [locale, pathname]);

  return null;
}
