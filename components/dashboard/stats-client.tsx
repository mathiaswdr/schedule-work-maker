"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";

type SummaryDay = {
  date: string;
  valueMs: number;
  breakMs: number;
  breakCount: number;
};

type Summary = {
  todayMs: number;
  weekMs: number;
  breakMs: number;
  breakCount: number;
  weekDays: SummaryDay[];
};

type SessionItem = {
  timezone?: string | null;
} | null;

type ApiResponse = {
  session: SessionItem;
  summary: Summary;
};

type StatsClientProps = {
  displayClassName: string;
};

type ExportField = {
  key: string;
  label: string;
};

const emptySummary: Summary = {
  todayMs: 0,
  weekMs: 0,
  breakMs: 0,
  breakCount: 0,
  weekDays: [],
};

const formatDuration = (ms: number) => {
  if (!ms || ms <= 0) return "0h 00m";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
};

const getWeekNumber = (date: Date) => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const escapeCsv = (value: string | number) => {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
};

export default function StatsClient({ displayClassName }: StatsClientProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
    date: true,
    workHours: true,
    breakMinutes: true,
    productivity: true,
    weekTotal: false,
    workMinutes: false,
    breakCount: false,
    timezone: false,
  });
  const [exportError, setExportError] = useState("");

  const exportFields: ExportField[] = [
    { key: "date", label: t("statsPage.export.fields.date") },
    { key: "workHours", label: t("statsPage.export.fields.workHours") },
    { key: "workMinutes", label: t("statsPage.export.fields.workMinutes") },
    { key: "breakMinutes", label: t("statsPage.export.fields.breakMinutes") },
    { key: "breakCount", label: t("statsPage.export.fields.breakCount") },
    { key: "productivity", label: t("statsPage.export.fields.productivity") },
    { key: "weekTotal", label: t("statsPage.export.fields.weekTotal") },
    { key: "timezone", label: t("statsPage.export.fields.timezone") },
  ];

  const dateFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }, [locale]);

  const dayFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
    });
  }, [locale]);

  const fetchStats = async () => {
    const response = await fetch("/api/work-sessions", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load work summary");
    }
    const payload = (await response.json()) as ApiResponse;
    setData(payload);
  };

  useEffect(() => {
    let isMounted = true;
    fetchStats()
      .catch(() => null)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const summary = data?.summary ?? emptySummary;
  const timezone =
    data?.session?.timezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const weekDays = summary.weekDays.length
    ? summary.weekDays
    : Array.from({ length: 5 }, (_, index) => {
        const base = new Date();
        const day = new Date(base);
        day.setDate(base.getDate() - ((base.getDay() + 6) % 7) + index);
        return { date: day.toISOString(), valueMs: 0, breakMs: 0, breakCount: 0 };
      });

  const maxWeekMs = Math.max(...weekDays.map((day) => day.valueMs), 1);
  const weekNumber = getWeekNumber(new Date());

  const productivity = summary.todayMs + summary.breakMs > 0
    ? Math.round((summary.todayMs / (summary.todayMs + summary.breakMs)) * 100)
    : 0;

  const breakAverage = summary.breakCount > 0
    ? Math.round(summary.breakMs / summary.breakCount / 60000)
    : 0;

  const daysActive = summary.weekDays.filter((day) => day.valueMs > 0).length;

  const handleToggleField = (key: string) => {
    setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));
    setExportError("");
  };

  const handleSelectAll = () => {
    const allSelected = exportFields.reduce<Record<string, boolean>>((acc, field) => {
      acc[field.key] = true;
      return acc;
    }, {});
    setSelectedFields(allSelected);
    setExportError("");
  };

  const handleClearAll = () => {
    const cleared = exportFields.reduce<Record<string, boolean>>((acc, field) => {
      acc[field.key] = false;
      return acc;
    }, {});
    setSelectedFields(cleared);
    setExportError("");
  };

  const handleExport = () => {
    const activeFields = exportFields.filter((field) => selectedFields[field.key]);
    if (!activeFields.length) {
      setExportError(t("statsPage.export.empty"));
      return;
    }

    const weekTotalHours = (summary.weekMs / 3600000).toFixed(2);
    const rows = weekDays.map((day) => {
      const breakMinutes = Math.round(day.breakMs / 60000);
      const dayProductivity = day.valueMs + day.breakMs > 0
        ? Math.round((day.valueMs / (day.valueMs + day.breakMs)) * 100)
        : 0;

      return {
        date: dateFormatter.format(new Date(day.date)),
        workHours: (day.valueMs / 3600000).toFixed(2),
        workMinutes: Math.round(day.valueMs / 60000),
        breakMinutes,
        breakCount: day.breakCount,
        productivity: dayProductivity,
        weekTotal: weekTotalHours,
        timezone,
      };
    });

    const header = activeFields.map((field) => escapeCsv(field.label)).join(",");
    const lines = rows.map((row) =>
      activeFields
        .map((field) => escapeCsv((row as Record<string, string | number>)[field.key]))
        .join(",")
    );
    const csv = [header, ...lines].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tempo-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.04,
      },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const listVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const barTransition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.16, 1, 0.3, 1],
  };

  return (
    <main className="w-full">
      <div className="relative overflow-hidden rounded-[32px] border border-line bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,118,110,0.45)] sm:p-8">
        <div className="pointer-events-none absolute -top-24 right-[-6rem] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.22),transparent_60%)] blur-2xl" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[-6rem] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(249,115,22,0.22),transparent_60%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(29,27,22,0.07)_1px,transparent_0)] bg-[length:18px_18px] opacity-30" />

        <motion.div
          className="relative z-10 space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.section
            variants={fadeUp}
            className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                {t("eyebrow")}
              </p>
              <h1 className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}>
                {t("statsPage.title")}
              </h1>
              <p className="max-w-xl text-sm text-ink-muted sm:text-base">
                {t("statsPage.subtitle")}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white/80 px-4 py-3 text-xs text-ink-muted">
              {t("statsPage.weekLabel", { week: weekNumber })}
            </div>
          </motion.section>

          <motion.section
            variants={fadeUp}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                label: t("summary.today"),
                value: formatDuration(summary.todayMs),
                detail: t("summary.goal", { hours: "7h" }),
              },
              {
                label: t("summary.week"),
                value: formatDuration(summary.weekMs),
                detail: t("summary.daysActive", { count: daysActive }),
              },
              {
                label: t("summary.breaks"),
                value: formatDuration(summary.breakMs),
                detail: t("summary.breakAvg", { minutes: breakAverage }),
              },
              {
                label: t("statsPage.cards.productivity"),
                value: `${productivity}%`,
                detail: t("statsPage.cards.productivityHint"),
              },
            ].map((card) => (
              <motion.div
                key={card.label}
                variants={itemVariants}
                className="rounded-2xl border border-line bg-white/80 px-5 py-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                <p className="mt-1 text-xs text-ink-muted">{card.detail}</p>
              </motion.div>
            ))}
          </motion.section>

          <motion.section
            variants={fadeUp}
            className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="rounded-3xl border border-line bg-white/80 p-6 shadow-[0_28px_60px_-48px_rgba(249,115,22,0.35)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t("stats.title")}</p>
                <span className="text-xs text-ink-muted">
                  {t("stats.week", { week: weekNumber })}
                </span>
              </div>
              <motion.div className="mt-6 space-y-4" variants={listVariants}>
                {weekDays.map((item) => {
                  const dateLabel = dayFormatter.format(new Date(item.date));
                  const width = (item.valueMs / maxWeekMs) * 100;
                  return (
                    <motion.div
                      key={item.date}
                      variants={itemVariants}
                      className="flex items-center gap-4"
                    >
                      <span className="w-10 text-xs text-ink-muted">
                        {dateLabel}
                      </span>
                      <div className="h-2 flex-1 rounded-full bg-ink-soft">
                        <motion.div
                          className="h-2 rounded-full bg-brand"
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={barTransition}
                        />
                      </div>
                      <span className="text-xs text-ink-muted">
                        {Math.round(item.valueMs / 360000) / 10}h
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            <div className="rounded-3xl border border-line bg-panel p-6">
              <p className="text-sm font-semibold">{t("statsPage.highlights.title")}</p>
              <motion.div className="mt-4 space-y-3" variants={listVariants}>
                {[
                  {
                    label: t("statsPage.highlights.activeDays"),
                    value: t("summary.daysActive", { count: daysActive }),
                  },
                  {
                    label: t("statsPage.highlights.breakAverage"),
                    value: t("statsPage.highlights.breakAverageValue", {
                      minutes: breakAverage,
                    }),
                  },
                  {
                    label: t("statsPage.highlights.productivity"),
                    value: `${productivity}%`,
                  },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    variants={itemVariants}
                    className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3"
                  >
                    <span className="text-sm text-ink-muted">
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </motion.div>
                ))}
              </motion.div>
              <div className="mt-5 rounded-2xl border border-line bg-white/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {t("statsPage.tips.label")}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {t("statsPage.tips.text")}
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section
            variants={fadeUp}
            className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="rounded-3xl border border-line bg-white/80 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">
                    {t("statsPage.export.title")}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {t("statsPage.export.subtitle")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="rounded-full border border-line-strong bg-white/80 px-3 py-1 text-xs font-semibold text-ink transition hover:bg-white"
                  >
                    {t("statsPage.export.selectAll")}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="rounded-full border border-line bg-white/70 px-3 py-1 text-xs text-ink-muted transition hover:bg-white"
                  >
                    {t("statsPage.export.clear")}
                  </button>
                </div>
              </div>
              <motion.div className="mt-5 grid gap-3 sm:grid-cols-2" variants={listVariants}>
                {exportFields.map((field) => (
                  <motion.label
                    key={field.key}
                    variants={itemVariants}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                      selectedFields[field.key]
                        ? "border-line-strong bg-white text-ink"
                        : "border-transparent bg-white/60 text-ink-muted hover:border-line"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields[field.key]}
                      onChange={() => handleToggleField(field.key)}
                      className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                    />
                    <span>{field.label}</span>
                  </motion.label>
                ))}
              </motion.div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-ink-muted">
                  {t("statsPage.export.hint")}
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  className="rounded-2xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)]"
                >
                  {t("statsPage.export.button")}
                </button>
              </div>
              {exportError ? (
                <p className="mt-3 text-xs text-red-600">{exportError}</p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-line bg-white/80 p-6">
              <p className="text-sm font-semibold">{t("statsPage.context.title")}</p>
              <p className="mt-2 text-sm text-ink-muted">
                {t("statsPage.context.subtitle")}
              </p>
              <motion.div className="mt-4 space-y-3" variants={listVariants}>
                {[
                  {
                    label: t("statsPage.context.timezone"),
                    value: timezone,
                  },
                  {
                    label: t("statsPage.context.breaks"),
                    value: t("statsPage.context.breaksValue", {
                      count: summary.breakCount,
                    }),
                  },
                  {
                    label: t("statsPage.context.sessions"),
                    value: t("statsPage.context.sessionsValue", {
                      count: daysActive,
                    }),
                  },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    variants={itemVariants}
                    className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3"
                  >
                    <span className="text-sm text-ink-muted">{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          {isLoading ? (
            <motion.div variants={fadeUp} className="text-sm text-ink-muted">
              {t("loading")}
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </main>
  );
}
