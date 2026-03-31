"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { pickVariants } from "@/lib/motion-variants";
import type {
  BillingClientPaymentPoint,
  BillingEntityStat,
  BillingRevenuePoint,
  BillingStatusBreakdown,
} from "@/server/billing-stats";

type BillingStatsClientProps = {
  displayClassName: string;
  currency: string;
  summary: {
    thisMonthTotal: number;
    thisYearTotal: number;
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    averageInvoice: number;
    invoiceCount: number;
    clientsCount: number;
  };
  dailyPoints: BillingRevenuePoint[];
  monthlyPoints: BillingRevenuePoint[];
  yearlyPoints: BillingRevenuePoint[];
  statusBreakdown: BillingStatusBreakdown[];
  topClients: BillingEntityStat[];
  topProjects: BillingEntityStat[];
  clientPaymentPoints: BillingClientPaymentPoint[];
};

const getBarWidth = (value: number, maxValue: number) =>
  `${Math.max((value / maxValue) * 100, value > 0 ? 6 : 0)}%`;

const CLIENT_CHART_COLORS = [
  "#F97316",
  "#0F766E",
  "#FACC15",
  "#2563EB",
  "#DB2777",
  "#7C3AED",
  "#059669",
  "#EA580C",
];

type ClientPeriodPreset =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "thisYear"
  | "pastYear"
  | "custom";

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);

const endOfYear = (date: Date) =>
  new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const escapeCsv = (value: string | number) => {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
};

const getPeriodRange = (
  period: ClientPeriodPreset,
  customStartDate: string,
  customEndDate: string
) => {
  const now = new Date();
  const todayStart = startOfDay(now);

  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = endOfDay(now);

  if (period === "today") {
    rangeStart = todayStart;
  } else if (period === "7d") {
    rangeStart = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
  } else if (period === "30d") {
    rangeStart = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
  } else if (period === "90d") {
    rangeStart = startOfDay(new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000));
  } else if (period === "thisYear") {
    rangeStart = startOfYear(now);
    rangeEnd = endOfDay(now);
  } else if (period === "pastYear") {
    const previousYear = new Date(now.getFullYear() - 1, 0, 1);
    rangeStart = startOfYear(previousYear);
    rangeEnd = endOfYear(previousYear);
  } else if (period === "custom") {
    rangeStart = customStartDate
      ? startOfDay(new Date(`${customStartDate}T00:00:00`))
      : null;
    rangeEnd = customEndDate
      ? endOfDay(new Date(`${customEndDate}T00:00:00`))
      : null;
  }

  return { rangeStart, rangeEnd };
};

export default function BillingStatsClient({
  displayClassName,
  currency,
  summary,
  dailyPoints,
  monthlyPoints,
  yearlyPoints,
  statusBreakdown,
  topClients,
  topProjects,
  clientPaymentPoints,
}: BillingStatsClientProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const v = pickVariants(shouldReduceMotion);
  const [clientPeriod, setClientPeriod] = useState<ClientPeriodPreset>("30d");
  const [customStartDate, setCustomStartDate] = useState(() =>
    toInputDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000))
  );
  const [customEndDate, setCustomEndDate] = useState(() =>
    toInputDate(new Date())
  );
  const [exportPeriod, setExportPeriod] = useState<ClientPeriodPreset>("30d");
  const [exportCustomStartDate, setExportCustomStartDate] = useState(() =>
    toInputDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000))
  );
  const [exportCustomEndDate, setExportCustomEndDate] = useState(() =>
    toInputDate(new Date())
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [currency, locale]
  );

  const compactCurrencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [currency, locale]
  );

  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
      }),
    [locale]
  );

  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "short",
      }),
    [locale]
  );

  const maxDailyTotal = Math.max(...dailyPoints.map((point) => point.total), 1);
  const maxMonthlyTotal = Math.max(
    ...monthlyPoints.map((point) => point.total),
    1
  );
  const maxYearlyTotal = Math.max(...yearlyPoints.map((point) => point.total), 1);
  const maxClientTotal = Math.max(...topClients.map((client) => client.total), 1);
  const maxProjectTotal = Math.max(
    ...topProjects.map((project) => project.total),
    1
  );

  const getEntityLabel = useCallback(
    (name: string) => {
      if (name === "__NO_CLIENT__") {
        return t("billingStatsPage.labels.noClient");
      }
      if (name === "__NO_PROJECT__") {
        return t("billingStatsPage.labels.noProject");
      }
      return name;
    },
    [t]
  );

  const paidClientBreakdown = useMemo(() => {
    const { rangeStart, rangeEnd } = getPeriodRange(
      clientPeriod,
      customStartDate,
      customEndDate
    );

    const byClient = new Map<string, number>();

    for (const point of clientPaymentPoints) {
      if (point.status !== "PAID") continue;
      const date = new Date(point.issueDate);
      if (rangeStart && date < rangeStart) continue;
      if (rangeEnd && date > rangeEnd) continue;
      byClient.set(point.clientName, (byClient.get(point.clientName) ?? 0) + point.total);
    }

    const items = Array.from(byClient.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    const total = items.reduce((sum, item) => sum + item.total, 0);
    const segments = items.reduce<
      {
        name: string;
        total: number;
        label: string;
        percentage: number;
        color: string;
        start: number;
      }[]
    >((acc, item, index) => {
      const previous = acc.at(-1);
      const start = previous ? previous.start + previous.percentage : 0;
      const percentage = total > 0 ? (item.total / total) * 100 : 0;
      acc.push({
        ...item,
        label: getEntityLabel(item.name),
        percentage,
        color: CLIENT_CHART_COLORS[index % CLIENT_CHART_COLORS.length],
        start,
      });
      return acc;
    }, []);

    return {
      total,
      segments,
      gradient:
        segments.length > 0
          ? `conic-gradient(${segments
              .map(
                (segment) =>
                  `${segment.color} ${segment.start}% ${segment.start + segment.percentage}%`
              )
              .join(", ")})`
          : "",
    };
  }, [clientPaymentPoints, clientPeriod, customEndDate, customStartDate, getEntityLabel]);

  const exportRows = useMemo(() => {
    const { rangeStart, rangeEnd } = getPeriodRange(
      exportPeriod,
      exportCustomStartDate,
      exportCustomEndDate
    );

    return clientPaymentPoints
      .filter((point) => {
        const date = new Date(point.issueDate);
        if (rangeStart && date < rangeStart) return false;
        if (rangeEnd && date > rangeEnd) return false;
        return true;
      })
      .map((point) => ({
        date: point.issueDate,
        client: getEntityLabel(point.clientName),
        project: getEntityLabel(point.projectName),
        status: t(`invoices.status.${point.status}`),
        paymentState:
          point.status === "PAID"
            ? t("billingStatsPage.export.paymentStates.collected")
            : t("billingStatsPage.export.paymentStates.pending"),
        amount: point.total,
      }));
  }, [
    clientPaymentPoints,
    exportCustomEndDate,
    exportCustomStartDate,
    exportPeriod,
    getEntityLabel,
    t,
  ]);

  const handleExportCsv = () => {
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const amountFormatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const header = [
      t("billingStatsPage.export.columns.date"),
      t("billingStatsPage.export.columns.client"),
      t("billingStatsPage.export.columns.project"),
      t("billingStatsPage.export.columns.status"),
      t("billingStatsPage.export.columns.paymentState"),
      t("billingStatsPage.export.columns.amount"),
      t("billingStatsPage.export.columns.currency"),
    ]
      .map(escapeCsv)
      .join(",");

    const lines = exportRows.map((row) =>
      [
        dateFormatter.format(new Date(row.date)),
        row.client,
        row.project,
        row.status,
        row.paymentState,
        amountFormatter.format(row.amount),
        currency,
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kronoma-billing-${exportPeriod}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    {
      label: t("billingStatsPage.cards.thisMonth"),
      value: currencyFormatter.format(summary.thisMonthTotal),
    },
    {
      label: t("billingStatsPage.cards.thisYear"),
      value: currencyFormatter.format(summary.thisYearTotal),
    },
    {
      label: t("billingStatsPage.cards.totalInvoiced"),
      value: currencyFormatter.format(summary.totalInvoiced),
    },
    {
      label: t("billingStatsPage.cards.totalPaid"),
      value: currencyFormatter.format(summary.totalPaid),
    },
    {
      label: t("billingStatsPage.cards.totalPending"),
      value: currencyFormatter.format(summary.totalPending),
    },
    {
      label: t("billingStatsPage.cards.averageInvoice"),
      value: currencyFormatter.format(summary.averageInvoice),
      detail: t("billingStatsPage.cards.averageInvoiceHint", {
        count: summary.invoiceCount,
      }),
    },
  ];

  return (
    <main className="w-full">
      <div className="relative overflow-hidden rounded-[32px] border border-line bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,118,110,0.45)] sm:p-8">
        <div className="pointer-events-none absolute -top-24 right-[-6rem] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.22),transparent_60%)] blur-2xl will-change-transform" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[-6rem] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(249,115,22,0.22),transparent_60%)] blur-3xl will-change-transform" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(29,27,22,0.07)_1px,transparent_0)] bg-[length:18px_18px] opacity-30 will-change-transform" />

        <motion.div
          className="relative z-10 space-y-8"
          variants={v.container}
          initial="hidden"
          animate="show"
        >
          <motion.section
            variants={v.fadeUp}
            className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="space-y-2">
              <p className="text-xs uppercase text-ink-muted">{t("eyebrow")}</p>
              <h1 className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}>
                {t("billingStatsPage.title")}
              </h1>
              <p className="max-w-2xl text-sm text-ink-muted sm:text-base">
                {t("billingStatsPage.subtitle")}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white/80 px-4 py-3 text-xs text-ink-muted">
              {t("billingStatsPage.cards.clientsBilled", {
                count: summary.clientsCount,
              })}
            </div>
          </motion.section>

          <motion.section
            variants={v.fadeUp}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {cards.map((card) => (
              <motion.div
                key={card.label}
                variants={v.item}
                className="rounded-2xl border border-line bg-white/80 px-5 py-4"
              >
                <p className="text-xs uppercase text-ink-muted">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                {card.detail ? (
                  <p className="mt-1 text-xs text-ink-muted">{card.detail}</p>
                ) : null}
              </motion.div>
            ))}
          </motion.section>

          <motion.section
            variants={v.fadeUp}
            className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div className="rounded-3xl border border-line bg-white/80 p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <div>
                    <p className="text-sm font-semibold">
                      {t("billingStatsPage.clientChart.title")}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {t("billingStatsPage.clientChart.subtitle")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "today",
                      "7d",
                      "30d",
                      "90d",
                      "thisYear",
                      "pastYear",
                      "custom",
                    ] as const
                  ).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setClientPeriod(period)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        clientPeriod === period
                          ? "bg-brand text-white"
                          : "border border-line bg-white/70 text-ink-muted hover:bg-white"
                      }`}
                    >
                      {t(`billingStatsPage.clientChart.periods.${period}`)}
                    </button>
                  ))}
                </div>

                {clientPeriod === "custom" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs uppercase text-ink-muted">
                        {t("billingStatsPage.clientChart.startDate")}
                      </span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(event) => setCustomStartDate(event.target.value)}
                        className="flex h-10 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase text-ink-muted">
                        {t("billingStatsPage.clientChart.endDate")}
                      </span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(event) => setCustomEndDate(event.target.value)}
                        className="flex h-10 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                )}
              </div>

              {paidClientBreakdown.total > 0 ? (
                <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr] lg:items-center">
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className="relative h-56 w-56 rounded-full"
                      style={{ background: paidClientBreakdown.gradient }}
                      aria-label={t("billingStatsPage.clientChart.title")}
                    >
                      <div className="absolute inset-[22%] flex items-center justify-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(229,231,235,0.8)]">
                        <div>
                          <p className="text-[10px] uppercase text-ink-muted">
                            {t("billingStatsPage.clientChart.centerLabel")}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-ink">
                            {currencyFormatter.format(paidClientBreakdown.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {paidClientBreakdown.segments.map((segment) => (
                      <div
                        key={segment.name}
                        className="rounded-2xl border border-line bg-panel px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: segment.color }}
                            />
                            <span className="text-sm font-medium text-ink">
                              {segment.label}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-ink">
                            {currencyFormatter.format(segment.total)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
                          <span>{segment.percentage.toFixed(1)}%</span>
                          <span>
                            {t("billingStatsPage.clientChart.paidOnly")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/60 px-4 py-8 text-center text-sm text-ink-muted">
                  {t("billingStatsPage.clientChart.empty")}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-line bg-white/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {t("billingStatsPage.charts.daily")}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {t("billingStatsPage.charts.dailyHint")}
                  </p>
                </div>
                <span className="text-xs text-ink-muted">
                  {t("billingStatsPage.labels.invoices", {
                    count: summary.invoiceCount,
                  })}
                </span>
              </div>
              <motion.div className="mt-6 space-y-4" variants={v.list}>
                {dailyPoints.map((point) => (
                  <motion.div
                    key={point.key}
                    variants={v.item}
                    className="flex items-center gap-4"
                  >
                    <span className="w-16 text-xs text-ink-muted">
                      {dayFormatter.format(new Date(`${point.key}T00:00:00`))}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-ink-soft">
                      <motion.div
                        className="h-2 rounded-full bg-brand"
                        initial={{ width: 0 }}
                        animate={{ width: getBarWidth(point.total, maxDailyTotal) }}
                        transition={v.bar}
                      />
                    </div>
                    <span className="w-24 text-right text-xs text-ink-muted">
                      {compactCurrencyFormatter.format(point.total)}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <div className="rounded-3xl border border-line bg-panel p-6">
              <div>
                <p className="text-sm font-semibold">
                  {t("billingStatsPage.lists.status")}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {t("billingStatsPage.lists.statusHint")}
                </p>
              </div>
              <motion.div className="mt-4 space-y-3" variants={v.list}>
                {statusBreakdown.map((entry) => (
                  <motion.div
                    key={entry.status}
                    variants={v.item}
                    className="rounded-2xl border border-line bg-white/70 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-ink">
                        {t(`invoices.status.${entry.status}`)}
                      </span>
                      <span className="text-sm font-semibold text-ink">
                        {currencyFormatter.format(entry.total)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {t("billingStatsPage.labels.invoices", {
                        count: entry.count,
                      })}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
              <div className="mt-5 rounded-2xl border border-line bg-white/70 px-4 py-3">
                <p className="text-xs uppercase text-ink-muted">
                  {t("billingStatsPage.cards.totalPaid")}
                </p>
                <p className="mt-1 text-lg font-semibold text-ink">
                  {currencyFormatter.format(summary.totalPaid)}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {t("billingStatsPage.paidHint", {
                    amount: currencyFormatter.format(summary.totalPending),
                  })}
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section
            variants={v.fadeUp}
            className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div className="rounded-3xl border border-line bg-white/80 p-6">
              <div>
                <p className="text-sm font-semibold">
                  {t("billingStatsPage.charts.monthly")}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {t("billingStatsPage.charts.monthlyHint")}
                </p>
              </div>
              <motion.div className="mt-6 space-y-4" variants={v.list}>
                {monthlyPoints.map((point) => (
                  <motion.div
                    key={point.key}
                    variants={v.item}
                    className="flex items-center gap-4"
                  >
                    <span className="w-12 text-xs text-ink-muted">
                      {monthFormatter.format(new Date(`${point.key}-01T00:00:00`))}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-ink-soft">
                      <motion.div
                        className="h-2 rounded-full bg-brand-2"
                        initial={{ width: 0 }}
                        animate={{ width: getBarWidth(point.total, maxMonthlyTotal) }}
                        transition={v.bar}
                      />
                    </div>
                    <span className="w-24 text-right text-xs text-ink-muted">
                      {compactCurrencyFormatter.format(point.total)}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <div className="rounded-3xl border border-line bg-white/80 p-6">
              <div>
                <p className="text-sm font-semibold">
                  {t("billingStatsPage.charts.yearly")}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {t("billingStatsPage.charts.yearlyHint")}
                </p>
              </div>
              <motion.div className="mt-4 space-y-3" variants={v.list}>
                {yearlyPoints.map((point) => (
                  <motion.div
                    key={point.key}
                    variants={v.item}
                    className="rounded-2xl border border-line bg-panel px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-ink">{point.key}</span>
                      <span className="text-sm font-semibold text-ink">
                        {currencyFormatter.format(point.total)}
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-ink-soft">
                      <motion.div
                        className="h-2 rounded-full bg-brand-3"
                        initial={{ width: 0 }}
                        animate={{ width: getBarWidth(point.total, maxYearlyTotal) }}
                        transition={v.bar}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            variants={v.fadeUp}
            className="grid gap-6 lg:grid-cols-[1fr_1fr]"
          >
            <div className="rounded-3xl border border-line bg-white/80 p-6">
              <div>
                <p className="text-sm font-semibold">
                  {t("billingStatsPage.lists.topClients")}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {t("billingStatsPage.lists.topClientsHint")}
                </p>
              </div>
              <motion.div className="mt-5 space-y-3" variants={v.list}>
                {topClients.length ? (
                  topClients.map((client) => (
                    <motion.div
                      key={client.name}
                      variants={v.item}
                      className="rounded-2xl border border-line bg-panel px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-ink">
                          {getEntityLabel(client.name)}
                        </span>
                        <span className="text-sm font-semibold text-ink">
                          {currencyFormatter.format(client.total)}
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-ink-soft">
                        <motion.div
                          className="h-2 rounded-full bg-brand"
                          initial={{ width: 0 }}
                          animate={{ width: getBarWidth(client.total, maxClientTotal) }}
                          transition={v.bar}
                        />
                      </div>
                      <p className="mt-2 text-xs text-ink-muted">
                        {t("billingStatsPage.clientMeta", {
                          count: client.count,
                          paid: currencyFormatter.format(client.paid),
                        })}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-line bg-white/60 px-4 py-6 text-sm text-ink-muted">
                    {t("billingStatsPage.lists.empty")}
                  </p>
                )}
              </motion.div>
            </div>

            <div className="rounded-3xl border border-line bg-white/80 p-6">
              <div>
                <p className="text-sm font-semibold">
                  {t("billingStatsPage.lists.topProjects")}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {t("billingStatsPage.lists.topProjectsHint")}
                </p>
              </div>
              <motion.div className="mt-5 space-y-3" variants={v.list}>
                {topProjects.length ? (
                  topProjects.map((project) => (
                    <motion.div
                      key={project.name}
                      variants={v.item}
                      className="rounded-2xl border border-line bg-panel px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-ink">
                          {getEntityLabel(project.name)}
                        </span>
                        <span className="text-sm font-semibold text-ink">
                          {currencyFormatter.format(project.total)}
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-ink-soft">
                        <motion.div
                          className="h-2 rounded-full bg-brand-2"
                          initial={{ width: 0 }}
                          animate={{ width: getBarWidth(project.total, maxProjectTotal) }}
                          transition={v.bar}
                        />
                      </div>
                      <p className="mt-2 text-xs text-ink-muted">
                        {t("billingStatsPage.projectMeta", {
                          count: project.count,
                          paid: currencyFormatter.format(project.paid),
                        })}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-line bg-white/60 px-4 py-6 text-sm text-ink-muted">
                    {t("billingStatsPage.lists.empty")}
                  </p>
                )}
              </motion.div>
            </div>
          </motion.section>

          <motion.section variants={v.fadeUp}>
            <div className="rounded-3xl border border-line bg-white/80 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {t("billingStatsPage.export.title")}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {t("billingStatsPage.export.subtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={!exportRows.length}
                  className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("billingStatsPage.export.button")}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(
                  [
                    "today",
                    "7d",
                    "30d",
                    "90d",
                    "thisYear",
                    "pastYear",
                    "custom",
                  ] as const
                ).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setExportPeriod(period)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      exportPeriod === period
                        ? "bg-brand text-white"
                        : "border border-line bg-white/70 text-ink-muted hover:bg-white"
                    }`}
                  >
                    {t(`billingStatsPage.clientChart.periods.${period}`)}
                  </button>
                ))}
              </div>

              {exportPeriod === "custom" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs uppercase text-ink-muted">
                      {t("billingStatsPage.export.startDate")}
                    </span>
                    <input
                      type="date"
                      value={exportCustomStartDate}
                      onChange={(event) =>
                        setExportCustomStartDate(event.target.value)
                      }
                      className="flex h-10 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase text-ink-muted">
                      {t("billingStatsPage.export.endDate")}
                    </span>
                    <input
                      type="date"
                      value={exportCustomEndDate}
                      onChange={(event) =>
                        setExportCustomEndDate(event.target.value)
                      }
                      className="flex h-10 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-4 py-3">
                <p className="text-sm text-ink-muted">
                  {t("billingStatsPage.export.rows", {
                    count: exportRows.length,
                  })}
                </p>
                <p className="text-xs text-ink-muted">
                  {t("billingStatsPage.export.hint")}
                </p>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </main>
  );
}
