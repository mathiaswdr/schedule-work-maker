"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { pickVariants } from "@/lib/motion-variants";
import { useAction } from "next-safe-action/hooks";
import { Clock, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { deleteWorkSession } from "@/server/actions/work-session-update";
import SessionEditDialog from "@/components/dashboard/session-edit-dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import LiveTimer from "@/components/dashboard/live-timer";

// ── Types ──

type BreakItem = {
  id: string;
  startedAt: string;
  endedAt: string | null;
};

type SessionItem = {
  id: string;
  status: "RUNNING" | "PAUSED" | "ENDED";
  startedAt: string;
  endedAt: string | null;
  note: string | null;
  breaks: BreakItem[];
  client: { id: string; name: string; color: string | null } | null;
  project: { id: string; name: string } | null;
};

type SessionMonthStats = {
  totalMonthMs: number;
  sessionCount: number;
};

type SessionsClientProps = {
  displayClassName: string;
  currency: string;
  hourlyRate: number;
  initialSessions?: SessionItem[];
  initialActiveSession?: SessionItem | null;
  initialHasMore?: boolean;
  initialMonthStats?: SessionMonthStats;
};

const PAGE_SIZE = 20;

// ── Helpers ──

const getSessionDurationMs = (s: SessionItem) => {
  const start = new Date(s.startedAt);
  const end = s.endedAt ? new Date(s.endedAt) : new Date();
  const breakMs = s.breaks.reduce((total, b) => {
    const bEnd = b.endedAt ? new Date(b.endedAt) : new Date();
    return total + (bEnd.getTime() - new Date(b.startedAt).getTime());
  }, 0);
  return Math.max(end.getTime() - start.getTime() - breakMs, 0);
};

const formatDuration = (ms: number) => {
  if (!ms || ms <= 0) return "0h 00m";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
};

// ── Component ──

export default function SessionsClient({
  displayClassName,
  currency,
  hourlyRate,
  initialSessions,
  initialActiveSession,
  initialHasMore,
  initialMonthStats,
}: SessionsClientProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const { confirm, ConfirmDialogElement } = useConfirm();

  const hasInitialSessions = initialSessions !== undefined;
  const hasInitialActiveSession = initialActiveSession !== undefined;
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions ?? []);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(initialActiveSession ?? null);
  const [hasMore, setHasMore] = useState(initialHasMore ?? false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [monthStats, setMonthStats] = useState<SessionMonthStats>(
    initialMonthStats ?? { totalMonthMs: 0, sessionCount: 0 }
  );
  const [isLoading, setIsLoading] = useState(!(hasInitialSessions && hasInitialActiveSession));
  const [editingSession, setEditingSession] = useState<SessionItem | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // ── Actions ──

  const { execute: executeDelete } = useAction(deleteWorkSession, {
    onSuccess: () => {
      toast.success(tc("delete"));
      fetchSessions();
    },
  });

  // ── Data fetching ──

  const fetchSessions = useCallback(async (offset = 0, append = false) => {
    const response = await fetch(
      `/api/sessions?offset=${offset}&limit=${PAGE_SIZE}`,
      { cache: "no-store" }
    );
    const payload = await response.json();
    setSessions((current) =>
      append ? [...current, ...(payload.sessions ?? [])] : payload.sessions ?? []
    );
    setActiveSession(payload.activeSession ?? null);
    setHasMore(Boolean(payload.hasMore));
    setMonthStats(payload.monthStats ?? { totalMonthMs: 0, sessionCount: 0 });
  }, []);

  useEffect(() => {
    if (hasInitialSessions && hasInitialActiveSession) return;

    let isMounted = true;
    fetchSessions()
      .catch(() => null)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [fetchSessions, hasInitialActiveSession, hasInitialSessions]);

  // ── Handlers ──

  const handleEdit = (session: SessionItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingSession(session);
    setEditDialogOpen(true);
  };

  const handleDelete = async (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const ok = await confirm({
      title: t("sessions.deleteSession"),
      description: t("sessions.deleteConfirm"),
      confirmLabel: tc("delete"),
      cancelLabel: tc("cancel"),
    });
    if (ok) executeDelete({ sessionId });
  };

  // ── Formatters ──

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }),
    [locale, currency]
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
    [locale]
  );

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale]
  );

  // ── Stats ──

  const monthRevenue = hourlyRate * (monthStats.totalMonthMs / 3600000);

  // ── Animation variants ──

  const v = pickVariants(shouldReduceMotion);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      await fetchSessions(sessions.length, true);
    } finally {
      setIsLoadingMore(false);
    }
  };

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
          {/* Header */}
          <motion.section variants={v.fadeUp} className="space-y-2">
            <p className="text-xs uppercase text-ink-muted">
              {t("eyebrow")}
            </p>
            <h1
              className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}
            >
              {t("sessions.title")}
            </h1>
            <p className="max-w-xl text-sm text-ink-muted sm:text-base">
              {t("sessions.subtitle")}
            </p>
          </motion.section>

          {/* Active session */}
          <AnimatePresence>
            {activeSession && (
              <motion.section
                variants={v.fadeUp}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -10 }}
              >
                <div
                  className={`relative overflow-hidden rounded-2xl border px-5 py-4 ${
                    activeSession.status === "RUNNING"
                      ? "border-emerald-200 bg-emerald-50/80"
                      : "border-amber-200 bg-amber-50/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        {activeSession.status === "RUNNING" ? (
                          <Play className="h-5 w-5 fill-emerald-500 text-emerald-500" />
                        ) : (
                          <Pause className="h-5 w-5 fill-amber-500 text-amber-500" />
                        )}
                        {activeSession.status === "RUNNING" && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {t(`sessions.${activeSession.status === "RUNNING" ? "running" : "paused"}`)}
                          </span>
                          <span className="text-xs text-ink-muted">
                            {t("sessions.since")}{" "}
                            {timeFormatter.format(new Date(activeSession.startedAt))}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          {activeSession.client && (
                            <span className="flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[10px]">
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    activeSession.client.color ?? "#6B7280",
                                }}
                              />
                              {activeSession.client.name}
                            </span>
                          )}
                          {activeSession.project && (
                            <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] text-brand">
                              {activeSession.project.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <LiveTimer
                        startedAt={activeSession.startedAt}
                        endedAt={activeSession.endedAt}
                        breaks={activeSession.breaks}
                        className="font-mono text-2xl font-bold"
                      />
                      {hourlyRate > 0 && (
                        <LiveTimer
                          startedAt={activeSession.startedAt}
                          endedAt={activeSession.endedAt}
                          breaks={activeSession.breaks}
                        >
                          {(ms) => (
                            <p className="text-xs text-ink-muted">
                              {currencyFormatter.format(hourlyRate * (ms / 3600000))}
                            </p>
                          )}
                        </LiveTimer>
                      )}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Summary cards */}
          {!isLoading && sessions.length > 0 && (
            <motion.section
              variants={v.fadeUp}
              className="grid gap-4 sm:grid-cols-3"
            >
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("sessions.hoursThisMonth")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatDuration(monthStats.totalMonthMs)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("sessions.revenueThisMonth")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {hourlyRate > 0
                    ? currencyFormatter.format(monthRevenue)
                    : "—"}
                </p>
                {hourlyRate <= 0 && (
                  <p className="mt-1 text-[10px] text-ink-muted">
                    {t("sessions.noRevenue")}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("sessions.sessionsThisMonth")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {monthStats.sessionCount}
                </p>
              </div>
            </motion.section>
          )}

          {/* Session list */}
          {isLoading ? (
            <motion.div variants={v.fadeUp} className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-ink-soft" />
              ))}
            </motion.div>
          ) : sessions.length === 0 ? (
            <motion.section
              variants={v.fadeUp}
              className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-line bg-white/50 py-16"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-soft">
                <Clock className="h-6 w-6 text-ink-muted" />
              </div>
              <div className="text-center">
                <p className="font-semibold">{t("sessions.emptyTitle")}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {t("sessions.emptySubtitle")}
                </p>
              </div>
            </motion.section>
          ) : (
            <motion.section variants={v.fadeUp} className="space-y-3">
              {sessions.map((session) => {
                const durationMs = getSessionDurationMs(session);
                const revenue = hourlyRate * (durationMs / 3600000);
                return (
                  <motion.div key={session.id} variants={v.item}>
                  <div
                    onClick={() => handleEdit(session)}
                    className="group flex cursor-pointer items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3 transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {dateFormatter.format(new Date(session.startedAt))}
                        </span>
                        <span className="text-xs text-ink-muted">
                          {timeFormatter.format(new Date(session.startedAt))}
                          {" — "}
                          {session.endedAt
                            ? timeFormatter.format(new Date(session.endedAt))
                            : "..."}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {session.client && (
                          <span className="flex items-center gap-1 rounded-full bg-ink-soft px-2 py-0.5 text-[10px]">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  session.client.color ?? "#6B7280",
                              }}
                            />
                            {session.client.name}
                          </span>
                        )}
                        {session.project && (
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] text-brand">
                            {session.project.name}
                          </span>
                        )}
                        {session.breaks.length > 0 && (
                          <span className="text-[10px] text-ink-muted">
                            {session.breaks.length}{" "}
                            {session.breaks.length === 1 ? "pause" : "pauses"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatDuration(durationMs)}
                        </p>
                        {hourlyRate > 0 && (
                          <p className="text-[10px] text-ink-muted">
                            {currencyFormatter.format(revenue)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => handleEdit(session, e)}
                          className="rounded-lg p-1.5 text-ink-muted hover:bg-ink-soft hover:text-ink"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(session.id, e)}
                          className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  </motion.div>
                );
              })}
              {hasMore && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoadingMore
                      ? t("sessions.loadingMore")
                      : t("sessions.loadMore")}
                  </button>
                </div>
              )}
            </motion.section>
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
          onSuccess={fetchSessions}
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
