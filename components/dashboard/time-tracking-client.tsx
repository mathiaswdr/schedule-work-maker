"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { pickVariants } from "@/lib/motion-variants";
import { ChevronDown, Pause, Pencil, Play, RefreshCw, Square, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { deleteWorkSession } from "@/server/actions/work-session-update";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import TimeCard from "@/components/dashboard/time-card";
import LiveTimer from "@/components/dashboard/live-timer";
import SessionEditDialog from "@/components/dashboard/session-edit-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  client?: { id: string; name: string; color: string | null } | null;
  project?: { id: string; name: string } | null;
} | null;

type ClientOption = {
  id: string;
  name: string;
  color: string | null;
};

type ProjectOption = {
  id: string;
  name: string;
  client: { id: string; name: string; color: string | null } | null;
};

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
  recentSessions: NonNullable<SessionItem>[];
};

type TimerAction = "start" | "pause" | "resume" | "end";

type TimeTrackingClientProps = {
  displayClassName: string;
  initialData?: ApiResponse;
  initialClients?: ClientOption[];
  initialProjects?: ProjectOption[];
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

const getSessionDurationMs = (s: { startedAt: string; endedAt: string | null; breaks: { startedAt: string; endedAt: string | null }[] }) => {
  const start = new Date(s.startedAt);
  const end = s.endedAt ? new Date(s.endedAt) : new Date();
  const breakMs = s.breaks.reduce((total, b) => {
    const bStart = new Date(b.startedAt);
    const bEnd = b.endedAt ? new Date(b.endedAt) : new Date();
    return total + (bEnd.getTime() - bStart.getTime());
  }, 0);
  return Math.max(end.getTime() - start.getTime() - breakMs, 0);
};

export default function TimeTrackingClient({
  displayClassName,
  initialData,
  initialClients,
  initialProjects,
}: TimeTrackingClientProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const { confirm, ConfirmDialogElement } = useConfirm();
  const hasInitialData = initialData !== undefined;
  const hasInitialClients = initialClients !== undefined;
  const hasInitialProjects = initialProjects !== undefined;
  const [data, setData] = useState<ApiResponse | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientOption[]>(initialClients ?? []);
  const [projects, setProjects] = useState<ProjectOption[]>(initialProjects ?? []);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<NonNullable<SessionItem> | null>(null);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  const timeFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [locale]);

  const fetchStatus = useCallback(async () => {
    const response = await fetch("/api/work-sessions", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load session status");
    }
    const payload = (await response.json()) as ApiResponse;
    setData(payload);
  }, []);

  const { execute: executeDeleteSession } = useAction(deleteWorkSession, {
    onSuccess: () => {
      toast.success(t("sessionEdit.deleted"));
      fetchStatus();
    },
  });

  // Initial fetch
  useEffect(() => {
    if (hasInitialData) return;

    let isMounted = true;
    fetchStatus()
      .catch(() => null)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [fetchStatus, hasInitialData]);

  // Fetch clients and projects in parallel on mount
  useEffect(() => {
    if (hasInitialClients && hasInitialProjects) return;

    Promise.all([
      fetch("/api/clients", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/projects", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([clientsData, projectsData]) => {
        setClients(clientsData.clients);
        setProjects(projectsData.projects);
      })
      .catch(() => null);
  }, [hasInitialClients, hasInitialProjects]);

  // Refetch projects when client filter changes
  useEffect(() => {
    if (selectedClientId === null) return;
    fetch(`/api/projects?clientId=${selectedClientId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setProjects(d.projects))
      .catch(() => null);
  }, [selectedClientId]);

  const refreshStatus = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      setIsRefreshing(true);
      try {
        await fetchStatus();
      } catch {
        if (!silent) {
          toast.error(t("timer.syncError"));
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [fetchStatus, t]
  );

  const handleAction = async (action: TimerAction) => {
    setIsActionLoading(true);
    try {
      const response = await fetch("/api/work-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          clientId: selectedClientId ?? undefined,
          projectId: selectedProjectId ?? undefined,
        }),
      });
      if (response.ok) {
        const payload = (await response.json()) as ApiResponse;
        setData(payload);
      } else {
        await fetchStatus();
      }
    } catch {
      await fetchStatus().catch(() => null);
    } finally {
      setIsActionLoading(false);
    }
  };

  const session = data?.session ?? null;
  const summary = data?.summary ?? emptySummary;
  const recentSessions = data?.recentSessions ?? [];
  const breaks = session?.breaks ?? [];
  const isSessionPaused = session?.status === "PAUSED";

  useEffect(() => {
    const syncOnVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshStatus({ silent: true }).catch(() => null);
      }
    };

    const syncOnFocus = () => {
      refreshStatus({ silent: true }).catch(() => null);
    };

    document.addEventListener("visibilitychange", syncOnVisibility);
    window.addEventListener("focus", syncOnFocus);

    return () => {
      document.removeEventListener("visibilitychange", syncOnVisibility);
      window.removeEventListener("focus", syncOnFocus);
    };
  }, [refreshStatus]);

  useEffect(() => {
    if (!session) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      refreshStatus({ silent: true }).catch(() => null);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshStatus, session]);

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

  const primaryAction = useMemo(() => {
    if (!session) {
      return {
        label: t("timer.start"),
        icon: Play,
        action: "start" as const,
        disabled: isActionLoading,
        color: "bg-brand",
        shadow: "shadow-[0_20px_60px_-12px_rgba(249,115,22,0.6)]",
        ring: "ring-brand/20",
      };
    }
    if (session.status === "RUNNING") {
      return {
        label: t("timer.pause"),
        icon: Pause,
        action: "pause" as const,
        disabled: isActionLoading,
        color: "bg-brand-3",
        shadow: "shadow-[0_20px_60px_-12px_rgba(250,204,21,0.5)]",
        ring: "ring-brand-3/20",
      };
    }
    return {
      label: t("timer.resume"),
      icon: Play,
      action: "resume" as const,
      disabled: isActionLoading,
      color: "bg-brand-2",
      shadow: "shadow-[0_20px_60px_-12px_rgba(15,118,110,0.5)]",
      ring: "ring-brand-2/20",
    };
  }, [session, isActionLoading, t]);

  const secondaryAction = useMemo(() => {
    if (session) {
      return {
        label: t("timer.end"),
        action: "end" as const,
        disabled: isActionLoading,
      };
    }
    return null;
  }, [session, isActionLoading, t]);

  const v = pickVariants(shouldReduceMotion);
  const refreshTooltip = t("timer.refreshTooltip");

  return (
    <main className="w-full">
      <div className="relative overflow-hidden rounded-[32px] border border-line bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,118,110,0.45)] sm:p-8">
        <div className="pointer-events-none absolute -top-24 right-[-6rem] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.25),transparent_60%)] blur-2xl will-change-transform" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[-6rem] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(249,115,22,0.25),transparent_60%)] blur-3xl will-change-transform" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(29,27,22,0.07)_1px,transparent_0)] bg-[length:18px_18px] opacity-30 will-change-transform" />

        <motion.div
          className="relative z-10 space-y-8"
          variants={v.container}
          initial="hidden"
          animate="show"
        >
          {/* ========== MOBILE LAYOUT ========== */}
          <div className="lg:hidden">
            {/* Header compact */}
            <motion.div variants={v.fadeUp} className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">
                {t("timer.eyebrow")}
              </p>
              <TimeCard />
            </motion.div>

            {/* Status badge */}
            <motion.div variants={v.fadeUp} className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  session?.status === "RUNNING"
                    ? "bg-brand-2/10 text-brand-2"
                    : session?.status === "PAUSED"
                    ? "bg-brand-3/10 text-brand-3"
                    : "bg-ink-soft text-ink-muted"
                }`}
              >
                {session?.status === "RUNNING" && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-2 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-2" />
                  </span>
                )}
                {statusLabel}
              </span>
              {session?.client && (
                <span className="flex items-center gap-1.5 rounded-full bg-ink-soft px-3 py-1 text-xs font-medium text-ink">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: session.client.color ?? "#6B7280" }}
                  />
                  {session.client.name}
                </span>
              )}
              {session?.project && (
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                  {session.project.name}
                </span>
              )}
            </motion.div>

            {/* Large timer */}
            <motion.div variants={v.fadeUp} className="mt-8 text-center">
              {session ? (
                <LiveTimer
                  startedAt={session.startedAt}
                  endedAt={session.endedAt}
                  breaks={breaks}
                  paused={isSessionPaused}
                  className="text-6xl font-semibold tracking-tight text-ink"
                />
              ) : (
                <span className="text-6xl font-semibold tracking-tight text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
                  00:00:00
                </span>
              )}
            </motion.div>

            {/* Primary action button */}
            <motion.div variants={v.fadeUp} className="mt-8 flex flex-col items-center gap-4">
              <motion.button
                type="button"
                onClick={() => handleAction(primaryAction.action)}
                disabled={primaryAction.disabled}
                whileTap={{ scale: 0.92 }}
                className={`flex h-24 w-24 items-center justify-center rounded-full ${primaryAction.color} ${primaryAction.shadow} ring-4 ${primaryAction.ring} text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <primaryAction.icon className="h-10 w-10" fill="currentColor" strokeWidth={0} />
              </motion.button>
              <span className="text-sm font-semibold text-ink-muted">
                {primaryAction.label}
              </span>

              {/* Secondary action */}
              <AnimatePresence>
                {secondaryAction && (
                  <motion.div
                    key="secondary-action"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-3"
                  >
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <button
                        type="button"
                        onClick={() => handleAction(secondaryAction.action)}
                        disabled={secondaryAction.disabled}
                        className="flex items-center gap-2 rounded-full border border-line-strong bg-white/80 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-50"
                      >
                        <Square className="h-4 w-4" />
                        {secondaryAction.label}
                      </button>
                    </motion.div>
                    <div className="group relative">
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <button
                          type="button"
                          onClick={() => refreshStatus()}
                          disabled={isRefreshing || isActionLoading}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/80 text-ink-muted transition hover:bg-white hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={t("timer.refresh")}
                        >
                          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        </button>
                      </motion.div>
                      <div className="pointer-events-none absolute -top-12 right-0 z-20 w-52 rounded-xl bg-ink px-3 py-2 text-[11px] font-medium leading-tight text-white opacity-0 shadow-lg transition-opacity duration-150 delay-0 group-hover:opacity-100 group-hover:delay-[2000ms] group-focus-within:opacity-100 group-focus-within:delay-[2000ms]">
                        {refreshTooltip}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Client/Project selectors (no session) */}
            <AnimatePresence>
              {!session && (
                <motion.div
                  key="mobile-selectors"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 space-y-3 overflow-hidden"
                >
                  <Select
                    value={selectedClientId ?? "none"}
                    onValueChange={(v) => {
                      setSelectedClientId(v === "none" ? null : v);
                      setSelectedProjectId(null);
                    }}
                  >
                    <SelectTrigger className="rounded-2xl border-line">
                      <SelectValue placeholder={t("timer.selectClient")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("timer.noClient")}</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: c.color ?? "#6B7280" }}
                            />
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedProjectId ?? "none"}
                    onValueChange={(v) => setSelectedProjectId(v === "none" ? null : v)}
                  >
                    <SelectTrigger className="rounded-2xl border-line">
                      <SelectValue placeholder={t("timer.selectProject")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("timer.noProject")}</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Summary stats (horizontal scroll) */}
            <motion.div variants={v.fadeUp} className="mt-8">
              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-ink-muted">
                {t("summary.eyebrow")}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: t("summary.today"), value: formatDuration(summary.todayMs) },
                  { label: t("summary.week"), value: formatDuration(summary.weekMs) },
                  { label: t("summary.breaks"), value: formatDuration(summary.breakMs) },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-line bg-white/80 px-4 py-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                      {card.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold">{card.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Collapsible timeline */}
            <motion.div variants={v.fadeUp} className="mt-6">
              <button
                type="button"
                onClick={() => setTimelineExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-line bg-white/80 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold">{t("timeline.title")}</p>
                  {timeline.length > 0 && (
                    <span className="rounded-full bg-ink-soft px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                      {timeline.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {session && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSession(session);
                        setEditDialogOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.stopPropagation(); setEditingSession(session); setEditDialogOpen(true); }
                      }}
                      className="rounded-lg p-1.5 text-ink-muted transition hover:bg-ink-soft hover:text-ink"
                      title={t("sessionEdit.title")}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <motion.div
                    animate={{ rotate: timelineExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-ink-muted" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence>
                {timelineExpanded && (
                  <motion.div
                    key="timeline-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pt-3">
                      {timeline.length ? (
                        timeline.map((item) => (
                          <div
                            key={`${item.label}-${item.time}`}
                            className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`h-2.5 w-2.5 rounded-full ${item.state}`} />
                              <span className="font-medium">{item.label}</span>
                            </div>
                            <span className="text-ink-muted">{item.time}</span>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-line bg-white/70 px-4 py-6 text-center text-sm text-ink-muted">
                          {t("empty.subtitle")}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Recent sessions */}
            {recentSessions.length > 0 && (
              <motion.div variants={v.fadeUp} className="mt-6">
                <p className="mb-3 text-sm font-semibold">{t("recentSessions.title")}</p>
                <div className="space-y-2">
                  {recentSessions.map((rs) => (
                    <div
                      key={rs.id}
                      className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-ink-muted" />
                          <span className="font-medium">
                            {new Date(rs.startedAt).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                          </span>
                          <span className="text-ink-muted">
                            {timeFormatter.format(new Date(rs.startedAt))} - {rs.endedAt ? timeFormatter.format(new Date(rs.endedAt)) : "..."}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pl-4">
                          {rs.client && (
                            <span className="flex items-center gap-1 rounded-full bg-ink-soft px-2 py-0.5 text-[10px]">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: rs.client.color ?? "#6B7280" }} />
                              {rs.client.name}
                            </span>
                          )}
                          {rs.project && (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] text-brand">
                              {rs.project.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-muted">{formatDuration(getSessionDurationMs(rs))}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSession(rs);
                            setEditDialogOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-ink-muted transition hover:bg-ink-soft hover:text-ink"
                          title={t("sessionEdit.title")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirm({
                              title: t("sessionEdit.title"),
                              description: t("sessionEdit.deleteConfirm"),
                              confirmLabel: tc("delete"),
                              cancelLabel: tc("cancel"),
                            });
                            if (ok) executeDeleteSession({ sessionId: rs.id });
                          }}
                          className="rounded-lg p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-red-500"
                          title={t("sessionEdit.delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Hint */}
            {session && (
              <p className="mt-4 text-center text-xs text-ink-muted">
                {t("timer.hint", { minutes: 6 })}
              </p>
            )}
          </div>

          {/* ========== DESKTOP LAYOUT ========== */}
          <motion.section
            variants={v.fadeUp}
            className="hidden lg:flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
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

          <motion.section variants={v.fadeUp} className="hidden lg:block">
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
              variants={v.list}
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
                  variants={v.item}
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
            variants={v.fadeUp}
            className="hidden lg:grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="space-y-6">
              <div className="rounded-3xl border border-line bg-panel p-6 shadow-[0_30px_60px_-46px_rgba(15,118,110,0.35)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                      {t("timer.eyebrow")}
                    </p>
                    {session ? (
                      <LiveTimer
                        startedAt={session.startedAt}
                        endedAt={session.endedAt}
                        breaks={breaks}
                        paused={isSessionPaused}
                        className="mt-2 text-4xl font-semibold"
                      />
                    ) : (
                      <span className="mt-2 block text-4xl font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                        00:00:00
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        session?.status === "RUNNING"
                          ? "bg-brand-2/10 text-brand-2"
                          : session?.status === "PAUSED"
                          ? "bg-brand-3/10 text-brand-3"
                          : "bg-ink-soft text-ink-muted"
                      }`}
                    >
                      {statusLabel}
                    </span>
                    {session?.client && (
                      <span className="flex items-center gap-1.5 rounded-full bg-ink-soft px-3 py-1 text-xs font-medium text-ink">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: session.client.color ?? "#6B7280" }}
                        />
                        {session.client.name}
                      </span>
                    )}
                    {session?.project && (
                      <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                        {session.project.name}
                      </span>
                    )}
                  </div>
                </div>

                {!session && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Select
                      value={selectedClientId ?? "none"}
                      onValueChange={(v) => {
                        setSelectedClientId(v === "none" ? null : v);
                        setSelectedProjectId(null);
                      }}
                    >
                      <SelectTrigger className="rounded-2xl border-line">
                        <SelectValue placeholder={t("timer.selectClient")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("timer.noClient")}</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: c.color ?? "#6B7280" }}
                              />
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedProjectId ?? "none"}
                      onValueChange={(v) => setSelectedProjectId(v === "none" ? null : v)}
                    >
                      <SelectTrigger className="rounded-2xl border-line">
                        <SelectValue placeholder={t("timer.selectProject")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("timer.noProject")}</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className={`mt-4 grid gap-3 ${secondaryAction ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-[1fr_auto]"}`}>
                  <button
                    type="button"
                    onClick={() => handleAction(primaryAction.action)}
                    disabled={primaryAction.disabled}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60 ${primaryAction.color} ${primaryAction.shadow}`}
                  >
                    {primaryAction.label}
                  </button>
                  {secondaryAction && (
                    <button
                      type="button"
                      onClick={() => handleAction(secondaryAction.action)}
                      disabled={secondaryAction.disabled}
                      className="rounded-2xl border border-line-strong bg-white/80 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {secondaryAction.label}
                    </button>
                  )}
                  <div className="group relative">
                    <button
                      type="button"
                      onClick={() => refreshStatus()}
                      disabled={isRefreshing || isActionLoading}
                      className="inline-flex h-full min-h-[48px] items-center justify-center rounded-2xl border border-line bg-white/80 px-4 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={t("timer.refresh")}
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                    <div className="pointer-events-none absolute -top-14 right-0 z-20 w-60 rounded-xl bg-ink px-3 py-2 text-[11px] font-medium leading-tight text-white opacity-0 shadow-lg transition-opacity duration-150 delay-0 group-hover:opacity-100 group-hover:delay-[2000ms] group-focus-within:opacity-100 group-focus-within:delay-[2000ms]">
                      {refreshTooltip}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-ink-muted">
                  {t("timer.hint", { minutes: 6 })}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-white/80 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t("timeline.title")}</p>
                <div className="flex items-center gap-2">
                  {session && (
                    <button
                      type="button"
                      onClick={() => { setEditingSession(session); setEditDialogOpen(true); }}
                      className="rounded-lg p-1.5 text-ink-muted transition hover:bg-ink-soft hover:text-ink"
                      title={t("sessionEdit.title")}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <span className="text-xs text-ink-muted">
                    {t("timeline.range")}
                  </span>
                </div>
              </div>
              <motion.div
                className="mt-6 space-y-4"
                variants={v.list}
              >
                {timeline.length ? (
                  timeline.map((item) => (
                    <motion.div
                      key={`${item.label}-${item.time}`}
                      variants={v.item}
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
                    variants={v.item}
                    className="rounded-2xl border border-line bg-white/70 px-4 py-6 text-center text-sm text-ink-muted"
                  >
                    {t("empty.subtitle")}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.section>

          {/* Recent sessions (desktop) */}
          {recentSessions.length > 0 && (
            <motion.section variants={v.fadeUp} className="hidden lg:block">
              <p className="mb-3 text-sm font-semibold">{t("recentSessions.title")}</p>
              <div className="space-y-2">
                {recentSessions.map((rs) => (
                  <div
                    key={rs.id}
                    className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-ink-muted" />
                      <span className="font-medium">
                        {new Date(rs.startedAt).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-ink-muted">
                        {timeFormatter.format(new Date(rs.startedAt))} - {rs.endedAt ? timeFormatter.format(new Date(rs.endedAt)) : "..."}
                      </span>
                      {rs.client && (
                        <span className="flex items-center gap-1 rounded-full bg-ink-soft px-2 py-0.5 text-[10px]">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: rs.client.color ?? "#6B7280" }} />
                          {rs.client.name}
                        </span>
                      )}
                      {rs.project && (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] text-brand">
                          {rs.project.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-ink-muted">{formatDuration(getSessionDurationMs(rs))}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSession(rs);
                          setEditDialogOpen(true);
                        }}
                        className="rounded-lg p-1.5 text-ink-muted transition hover:bg-ink-soft hover:text-ink"
                        title={t("sessionEdit.title")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirm({
                            title: t("sessionEdit.title"),
                            description: t("sessionEdit.deleteConfirm"),
                            confirmLabel: tc("delete"),
                            cancelLabel: tc("cancel"),
                          });
                          if (ok) executeDeleteSession({ sessionId: rs.id });
                        }}
                        className="rounded-lg p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-red-500"
                        title={t("sessionEdit.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {isLoading && (
            <motion.div variants={v.fadeUp} className="space-y-3">
              <div className="h-10 w-full animate-pulse rounded-2xl bg-ink-soft" />
              <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-ink-soft" />
            </motion.div>
          )}
        </motion.div>
      </div>

      {editingSession && (
        <SessionEditDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingSession(null);
          }}
          onSuccess={fetchStatus}
          sessionId={editingSession.id}
          currentClientId={editingSession.client?.id ?? null}
          currentProjectId={editingSession.project?.id ?? null}
          currentStartedAt={editingSession.startedAt}
          currentEndedAt={editingSession.endedAt}
          currentStatus={editingSession.status}
        />
      )}
      {ConfirmDialogElement}
    </main>
  );
}
