"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import TimeCard from "@/components/dashboard/time-card";

type SessionStatus = "RUNNING" | "PAUSED" | "ENDED";

type BreakItem = {
  id: string;
  startedAt: string;
  endedAt: string | null;
};

type SessionItem = {
  id: string;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  timezone?: string | null;
  breaks: BreakItem[];
} | null;

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

type ApiResponse = {
  session: SessionItem;
  summary: Summary;
};

type TimeTrackingClientProps = {
  displayClassName: string;
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

const formatTimer = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};

export default function TimeTrackingClient({
  displayClassName,
}: TimeTrackingClientProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const timeFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [locale]);

  const fetchStatus = async () => {
    const response = await fetch("/api/work-sessions", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load session status");
    }
    const payload = (await response.json()) as ApiResponse;
    setData(payload);
  };

  useEffect(() => {
    let isMounted = true;
    fetchStatus()
      .catch(() => null)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = async (action: "start" | "stop") => {
    setIsActionLoading(true);
    try {
      await fetch("/api/work-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      await fetchStatus();
    } finally {
      setIsActionLoading(false);
    }
  };

  const session = data?.session ?? null;
  const summary = data?.summary ?? emptySummary;
  const breaks = session?.breaks ?? [];

  const sessionMs = useMemo(() => {
    if (!session) return 0;
    const start = new Date(session.startedAt);
    const end = session.endedAt ? new Date(session.endedAt) : now;
    const breakMs = breaks.reduce((total, pause) => {
      const pauseStart = new Date(pause.startedAt);
      const pauseEnd = pause.endedAt ? new Date(pause.endedAt) : now;
      return total + (pauseEnd.getTime() - pauseStart.getTime());
    }, 0);
    return Math.max(end.getTime() - start.getTime() - breakMs, 0);
  }, [breaks, now, session]);

  const breakAverage = summary.breakCount > 0
    ? Math.round(summary.breakMs / summary.breakCount / 60000)
    : 0;

  const daysActive = summary.weekDays.filter((day) => day.valueMs > 0).length;

  const timeline = useMemo(() => {
    if (!session) return [] as { label: string; time: string; state: string }[];

    const events: { label: string; time: Date; state: string }[] = [
      {
        label: t("timeline.start"),
        time: new Date(session.startedAt),
        state: "bg-brand",
      },
    ];

    for (const pause of breaks) {
      events.push({
        label: t("timeline.pause"),
        time: new Date(pause.startedAt),
        state: "bg-brand-3",
      });
      if (pause.endedAt) {
        events.push({
          label: t("timeline.resume"),
          time: new Date(pause.endedAt),
          state: "bg-brand-2",
        });
      }
    }

    if (session.endedAt) {
      events.push({
        label: t("timeline.end"),
        time: new Date(session.endedAt),
        state: "bg-ink",
      });
    }

    return events
      .sort((a, b) => a.time.getTime() - b.time.getTime())
      .map((event) => ({
        label: event.label,
        time: timeFormatter.format(event.time),
        state: event.state,
      }));
  }, [breaks, session, t, timeFormatter]);

  const statusLabel = session
    ? session.status === "RUNNING"
      ? t("timer.running")
      : session.status === "PAUSED"
      ? t("timer.paused")
      : t("timer.stopped")
    : t("timer.stopped");

  const startLabel = session
    ? session.status === "PAUSED"
      ? t("timer.resume")
      : t("timer.running")
    : t("timer.start");

  const stopLabel = session
    ? session.status === "PAUSED"
      ? t("timer.end")
      : t("timer.stop")
    : t("timer.stop");

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

  return (
    <main className="w-full">
      <div className="relative overflow-hidden rounded-[32px] border border-line bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,118,110,0.45)] sm:p-8">
        <div className="pointer-events-none absolute -top-24 right-[-6rem] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.25),transparent_60%)] blur-2xl" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[-6rem] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(249,115,22,0.25),transparent_60%)] blur-3xl" />
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
                {t("time.title")}
              </h1>
              <p className="max-w-xl text-sm text-ink-muted sm:text-base">
                {t("time.subtitle")}
              </p>
            </div>
            <TimeCard />
          </motion.section>

          <motion.section variants={fadeUp}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {t("summary.eyebrow")}
                </p>
                <p className="text-sm text-ink-muted">{t("summary.subtitle")}</p>
              </div>
            </div>
            <motion.div
              className="grid gap-4 sm:grid-cols-3"
              variants={listVariants}
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
            </motion.div>
          </motion.section>

          <motion.section
            variants={fadeUp}
            className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="space-y-6">
              <div className="rounded-3xl border border-line bg-panel p-6 shadow-[0_30px_60px_-46px_rgba(15,118,110,0.35)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                      {t("timer.eyebrow")}
                    </p>
                    <p className="mt-2 text-4xl font-semibold">
                      {formatTimer(sessionMs)}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-2/10 px-3 py-1 text-xs font-semibold text-brand-2">
                    {statusLabel}
                  </span>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleAction("start")}
                    disabled={isActionLoading || session?.status === "RUNNING"}
                    className="rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {startLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction("stop")}
                    disabled={isActionLoading || !session}
                    className="rounded-2xl border border-line-strong bg-white/80 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {stopLabel}
                  </button>
                </div>
                <p className="mt-4 text-xs text-ink-muted">
                  {t("timer.hint", { minutes: 6 })}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-white/80 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t("timeline.title")}</p>
                <span className="text-xs text-ink-muted">
                  {t("timeline.range")}
                </span>
              </div>
              <motion.div
                className="mt-6 space-y-4"
                variants={listVariants}
              >
                {timeline.length ? (
                  timeline.map((item) => (
                    <motion.div
                      key={`${item.label}-${item.time}`}
                      variants={itemVariants}
                      className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.state}`} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <span className="text-ink-muted">{item.time}</span>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    variants={itemVariants}
                    className="rounded-2xl border border-line bg-white/70 px-4 py-6 text-center text-sm text-ink-muted"
                  >
                    {t("empty.subtitle")}
                  </motion.div>
                )}
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
