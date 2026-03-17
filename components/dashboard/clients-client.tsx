"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { pickVariants } from "@/lib/motion-variants";
import { ArrowLeft, FileText, FolderKanban, Mail, Pencil, Plus, Trash2, Users } from "lucide-react";
import ClientFormDialog from "@/components/dashboard/client-form-dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

type ClientItem = {
  id: string;
  name: string;
  email: string | null;
  color: string | null;
  notes: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  _count: { projects: number; workSessions: number };
};

type ClientDetailProject = {
  id: string;
  name: string;
  serviceType: { id: string; name: string; color: string | null } | null;
  _count: { workSessions: number };
};

type ClientDetailSession = {
  id: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  project: { id: string; name: string } | null;
  breaks: { startedAt: string; endedAt: string | null }[];
};

type ClientDetailInvoice = {
  id: string;
  displayNumber: string;
  status: string;
  source: string;
  total: number;
  issueDate: string;
  dueDate: string | null;
  project: { id: string; name: string } | null;
};

type ClientAnalytics = {
  totalTimeMs: number;
  totalBreakMs: number;
  totalBreakCount: number;
  avgSessionMs: number;
  longestSessionMs: number;
  productivityPct: number;
  avgBreakMs: number;
  dailyActivity: { date: string; ms: number }[];
  timeByProject: { name: string; color: string; ms: number }[];
  invoiceTotals: { pending: number; paid: number };
};

type ClientDetail = ClientItem & {
  projects: ClientDetailProject[];
  recentSessions: ClientDetailSession[];
  recentInvoices: ClientDetailInvoice[];
  hasMoreSessions: boolean;
  hasMoreInvoices: boolean;
  analytics: ClientAnalytics | null;
};

type ClientsClientProps = {
  displayClassName: string;
  currency: string;
  userPlan?: string;
  clientLimit?: { allowed: boolean; current: number; max: number | null };
  initialClients?: ClientItem[];
};

const formatDuration = (ms: number) => {
  if (!ms || ms <= 0) return "0h 00m";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
};

const getSessionMs = (
  session: { startedAt: string; endedAt: string | null },
  breaks: { startedAt: string; endedAt: string | null }[]
) => {
  const now = new Date();
  const start = new Date(session.startedAt);
  const end = session.endedAt ? new Date(session.endedAt) : now;
  const breakMs = breaks.reduce((total, pause) => {
    const pStart = new Date(pause.startedAt);
    const pEnd = pause.endedAt ? new Date(pause.endedAt) : now;
    return total + (pEnd.getTime() - pStart.getTime());
  }, 0);
  return Math.max(end.getTime() - start.getTime() - breakMs, 0);
};

export default function ClientsClient({ displayClassName, currency, clientLimit, initialClients }: ClientsClientProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { confirm, ConfirmDialogElement } = useConfirm();
  const hasInitialClients = initialClients !== undefined;
  const [clients, setClients] = useState<ClientItem[]>(initialClients ?? []);
  const [isLoading, setIsLoading] = useState(!hasInitialClients);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);

  // Detail view state
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [isLoadingMoreSessions, setIsLoadingMoreSessions] = useState(false);
  const [isLoadingMoreInvoices, setIsLoadingMoreInvoices] = useState(false);

  const fetchClients = async () => {
    const response = await fetch("/api/clients", { cache: "no-store" });
    const payload = await response.json();
    setClients(payload.clients);
  };

  const fetchClientDetail = async (
    id: string,
    options?: {
      sessionOffset?: number;
      invoiceOffset?: number;
      appendSessions?: boolean;
      appendInvoices?: boolean;
    }
  ) => {
    const {
      sessionOffset = 0,
      invoiceOffset = 0,
      appendSessions = false,
      appendInvoices = false,
    } = options ?? {};

    if (!appendSessions && !appendInvoices) {
      setIsDetailLoading(true);
    }
    try {
      const response = await fetch(
        `/api/clients/${id}?sessionOffset=${sessionOffset}&invoiceOffset=${invoiceOffset}`,
        { cache: "no-store" }
      );
      if (!response.ok) return;
      const payload = await response.json();
      setSelectedClient((current) => ({
        ...payload.client,
        projects: payload.projects,
        analytics: current?.id === payload.client.id ? current?.analytics ?? null : null,
        hasMoreSessions: payload.hasMoreSessions,
        hasMoreInvoices: payload.hasMoreInvoices,
        recentSessions: appendSessions
          ? [...(current?.recentSessions ?? []), ...(payload.recentSessions ?? [])]
          : payload.recentSessions ?? [],
        recentInvoices: appendInvoices
          ? [...(current?.recentInvoices ?? []), ...(payload.recentInvoices ?? [])]
          : payload.recentInvoices ?? [],
      }));
    } finally {
      if (!appendSessions && !appendInvoices) {
        setIsDetailLoading(false);
      }
    }
  };

  const fetchClientAnalytics = async (id: string) => {
    setIsAnalyticsLoading(true);
    try {
      const response = await fetch(`/api/clients/${id}/analytics`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = await response.json();
      setSelectedClient((current) =>
        current && current.id === id
          ? {
              ...current,
              analytics: payload.analytics ?? null,
            }
          : current
      );
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (hasInitialClients) return;

    let isMounted = true;
    fetchClients()
      .catch(() => null)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [hasInitialClients]);

  const handleEdit = (client: ClientItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const ok = await confirm({
      title: t("clients.deleteClient"),
      description: t("clients.deleteConfirm"),
      confirmLabel: tc("delete"),
      cancelLabel: tc("cancel"),
    });
    if (!ok) return;

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      toast.success(t("clients.deleted"));
      setSelectedClient(null);
      await fetchClients();
    } catch {
      toast.error(t("settingsPage.error"));
    }
  };

  const handleDialogSuccess = () => {
    fetchClients();
    if (selectedClient) {
      fetchClientDetail(selectedClient.id).then(() => {
        void fetchClientAnalytics(selectedClient.id);
      });
    }
  };

  const handleBack = () => {
    setSelectedClient(null);
    fetchClients();
  };

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale]
  );

  const analytics = selectedClient?.analytics ?? null;
  const dailyActivity = useMemo(
    () => analytics?.dailyActivity ?? [],
    [analytics?.dailyActivity]
  );
  const timeByProject = useMemo(
    () => analytics?.timeByProject ?? [],
    [analytics?.timeByProject]
  );
  const maxDailyMs = useMemo(
    () => Math.max(...dailyActivity.map((d) => d.ms), 1),
    [dailyActivity]
  );
  const maxProjectMs = useMemo(
    () => Math.max(...timeByProject.map((p) => p.ms), 1),
    [timeByProject]
  );

  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "short" }),
    [locale]
  );

  const shortDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }),
    [locale]
  );

  const mostActiveDay = useMemo(() => {
    if (dailyActivity.length === 0) return "";
    const best = dailyActivity.reduce((a, b) => (b.ms > a.ms ? b : a));
    if (best.ms === 0) return "—";
    return shortDateFormatter.format(new Date(best.date));
  }, [dailyActivity, shortDateFormatter]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }),
    [locale, currency]
  );

  const invoiceDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale]
  );

  const invoiceTotals = analytics?.invoiceTotals ?? {
    pending: 0,
    paid: 0,
  };

  const openClientDetail = async (id: string) => {
    await fetchClientDetail(id);
    void fetchClientAnalytics(id);
  };

  const handleLoadMoreSessions = async () => {
    if (!selectedClient) return;
    setIsLoadingMoreSessions(true);
    try {
      await fetchClientDetail(selectedClient.id, {
        sessionOffset: selectedClient.recentSessions.length,
        invoiceOffset: 0,
        appendSessions: true,
      });
    } finally {
      setIsLoadingMoreSessions(false);
    }
  };

  const handleLoadMoreInvoices = async () => {
    if (!selectedClient) return;
    setIsLoadingMoreInvoices(true);
    try {
      await fetchClientDetail(selectedClient.id, {
        sessionOffset: 0,
        invoiceOffset: selectedClient.recentInvoices.length,
        appendInvoices: true,
      });
    } finally {
      setIsLoadingMoreInvoices(false);
    }
  };

  const v = pickVariants(shouldReduceMotion);

  // ─── Detail View ───
  if (selectedClient) {
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
            key={selectedClient.id}
          >
            {/* Header */}
            <motion.section variants={v.fadeUp} className="space-y-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("clients.back")}
              </button>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
                    style={{ backgroundColor: selectedClient.color ?? "#6B7280" }}
                  >
                    {selectedClient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}>
                      {selectedClient.name}
                    </h1>
                    {selectedClient.email && (
                      <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                        <Mail className="h-3.5 w-3.5" />
                        {selectedClient.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => handleEdit(selectedClient)}
                    aria-label={t("clients.editClient")}
                    className="flex items-center gap-2 rounded-2xl border border-line bg-white/80 px-4 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-white hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("clients.editClient")}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(selectedClient.id, e)}
                    aria-label={t("clients.deleteClient")}
                    className="flex items-center gap-2 rounded-2xl border border-line bg-white/80 px-4 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Summary cards */}
            <motion.section variants={v.fadeUp} className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("clients.detailProjects")}
                </p>
                <p className="mt-2 text-2xl font-semibold">{selectedClient._count.projects}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("clients.sessions", { count: "" }).replace(/^\s+/, "").replace(/\s+$/, "")}
                </p>
                <p className="mt-2 text-2xl font-semibold">{selectedClient._count.workSessions}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("clients.totalTime")}
                </p>
                {analytics ? (
                  <p className="mt-2 text-2xl font-semibold">
                    {formatDuration(analytics.totalTimeMs)}
                  </p>
                ) : (
                  <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-ink-soft" />
                )}
              </div>
            </motion.section>

            {/* Info + Notes */}
            {selectedClient.notes && (
              <motion.section variants={v.fadeUp}>
                <div className="rounded-3xl border border-line bg-white/80 p-6">
                  <p className="text-sm font-semibold">{t("clients.detailInfo")}</p>
                  <p className="mt-3 text-sm text-ink-muted whitespace-pre-wrap">
                    {selectedClient.notes}
                  </p>
                </div>
              </motion.section>
            )}

            {/* ─── Analytics ─── */}
            {analytics ? (
              <>
                {/* Daily activity bar chart */}
                <motion.section
                  variants={v.fadeUp}
                  className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
                >
                  <div className="rounded-3xl border border-line bg-white/80 p-6 shadow-[0_28px_60px_-48px_rgba(249,115,22,0.35)]">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {t("clients.dailyActivity")}
                      </p>
                      <span className="text-xs text-ink-muted">
                        {t("clients.last14days")}
                      </span>
                    </div>
                    <motion.div
                      className="mt-6 flex items-end gap-1.5"
                      style={{ height: 120 }}
                      variants={v.list}
                    >
                      {dailyActivity.map((day) => {
                        const height =
                          day.ms > 0 ? Math.max((day.ms / maxDailyMs) * 100, 4) : 0;
                        const isToday =
                          new Date(day.date).toDateString() === new Date().toDateString();
                        return (
                          <motion.div
                            key={day.date}
                            className="group relative flex flex-1 flex-col items-center"
                            style={{ height: "100%" }}
                            variants={v.item}
                          >
                            <div className="flex flex-1 w-full items-end">
                              <motion.div
                                className={`w-full rounded-t-lg ${
                                  isToday ? "bg-brand" : "bg-brand/60"
                                }`}
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={v.bar}
                              />
                            </div>
                            <span className="mt-1.5 text-[9px] text-ink-muted">
                              {dayFormatter
                                .format(new Date(day.date))
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                            {/* Tooltip */}
                            {day.ms > 0 && (
                              <div className="pointer-events-none absolute -top-8 left-1/2 z-20 hidden -translate-x-1/2 rounded-lg bg-ink px-2 py-1 text-[10px] font-medium text-white whitespace-nowrap group-hover:block">
                                {shortDateFormatter.format(new Date(day.date))} — {formatDuration(day.ms)}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>

                  {/* Highlights */}
                  <div className="rounded-3xl border border-line bg-panel p-6">
                    <p className="text-sm font-semibold">
                      {t("clients.highlights")}
                    </p>
                    <motion.div
                      className="mt-4 space-y-3"
                      variants={v.list}
                    >
                      {[
                        {
                          label: t("clients.avgSession"),
                          value: formatDuration(analytics.avgSessionMs),
                        },
                        {
                          label: t("clients.longestSession"),
                          value: formatDuration(analytics.longestSessionMs),
                        },
                        {
                          label: t("clients.productivity"),
                          value: `${analytics.productivityPct}%`,
                        },
                        {
                          label: t("clients.mostActiveDay"),
                          value: mostActiveDay,
                        },
                        {
                          label: t("clients.totalBreaks"),
                          value: String(analytics.totalBreakCount),
                        },
                        {
                          label: t("clients.avgBreakDuration"),
                          value: formatDuration(analytics.avgBreakMs),
                        },
                      ].map((item) => (
                        <motion.div
                          key={item.label}
                          variants={v.item}
                          className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3"
                        >
                          <span className="text-sm text-ink-muted">
                            {item.label}
                          </span>
                          <span className="text-sm font-semibold">
                            {item.value}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </motion.section>

                {/* Time by project */}
                {timeByProject.length > 0 && (
                  <motion.section variants={v.fadeUp}>
                    <div className="rounded-3xl border border-line bg-white/80 p-6">
                      <p className="text-sm font-semibold">
                        {t("clients.timeByProject")}
                      </p>
                      <motion.div
                        className="mt-5 space-y-4"
                        variants={v.list}
                      >
                        {timeByProject.map((p) => {
                          const width = (p.ms / maxProjectMs) * 100;
                          const pct =
                            analytics.totalTimeMs > 0
                              ? Math.round((p.ms / analytics.totalTimeMs) * 100)
                              : 0;
                          return (
                            <motion.div
                              key={p.name}
                              variants={v.item}
                              className="flex items-center gap-4"
                            >
                              <span className="w-28 shrink-0 truncate text-xs text-ink-muted">
                                {p.name}
                              </span>
                              <div className="h-2.5 flex-1 rounded-full bg-ink-soft">
                                <motion.div
                                  className="h-2.5 rounded-full"
                                  style={{ backgroundColor: p.color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${width}%` }}
                                  transition={v.bar}
                                />
                              </div>
                              <span className="w-20 shrink-0 text-right text-xs text-ink-muted">
                                {formatDuration(p.ms)}{" "}
                                <span className="text-ink-muted/60">({pct}%)</span>
                              </span>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </div>
                  </motion.section>
                )}
              </>
            ) : isAnalyticsLoading ? (
              <motion.section
                variants={v.fadeUp}
                className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
              >
                <div className="h-64 animate-pulse rounded-3xl border border-line bg-white/80" />
                <div className="h-64 animate-pulse rounded-3xl border border-line bg-panel" />
              </motion.section>
            ) : null}

            {/* Projects */}
            <motion.section variants={v.fadeUp}>
              <p className="mb-4 text-sm font-semibold">{t("clients.detailProjects")}</p>
              {selectedClient.projects.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedClient.projects.map((project) => (
                    <motion.div
                      key={project.id}
                      variants={v.item}
                      className="rounded-2xl border border-line bg-white/80 px-5 py-4"
                    >
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-ink-muted" />
                        <p className="font-medium">{project.name}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.serviceType && (
                          <span className="flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs text-brand">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: project.serviceType.color ?? "#6B7280" }}
                            />
                            {project.serviceType.name}
                          </span>
                        )}
                        <span className="rounded-full bg-ink-soft px-2.5 py-1 text-xs text-ink-muted">
                          {t("projects.sessions", { count: project._count.workSessions })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-line bg-white/50 px-5 py-8 text-center text-sm text-ink-muted">
                  {t("projects.emptyTitle")}
                </div>
              )}
            </motion.section>

            {/* Recent sessions */}
            <motion.section variants={v.fadeUp}>
              <p className="mb-4 text-sm font-semibold">{t("clients.detailSessions")}</p>
              {selectedClient.recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {selectedClient.recentSessions.map((ws) => {
                    const duration = getSessionMs(ws, ws.breaks);
                    return (
                      <motion.div
                        key={ws.id}
                        variants={v.item}
                        className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              ws.status === "RUNNING"
                                ? "bg-brand"
                                : ws.status === "PAUSED"
                                ? "bg-brand-3"
                                : "bg-ink-muted"
                            }`}
                          />
                          <span className="text-ink-muted">
                            {dateFormatter.format(new Date(ws.startedAt))}
                          </span>
                          {ws.project && (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                              {ws.project.name}
                            </span>
                          )}
                        </div>
                        <span className="font-medium">{formatDuration(duration)}</span>
                      </motion.div>
                    );
                  })}
                  {selectedClient.hasMoreSessions && (
                    <button
                      type="button"
                      onClick={handleLoadMoreSessions}
                      disabled={isLoadingMoreSessions}
                      className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoadingMoreSessions
                        ? t("clients.loadingMoreSessions")
                        : t("clients.loadMoreSessions")}
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-line bg-white/50 px-5 py-8 text-center text-sm text-ink-muted">
                  {t("clients.noSessions")}
                </div>
              )}
            </motion.section>

            {/* Invoices */}
            <motion.section variants={v.fadeUp}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">{t("clients.invoices")}</p>
                {selectedClient.recentInvoices.length > 0 && (
                  <div className="flex gap-3 text-xs">
                    <span className="text-ink-muted">
                      {t("clients.invoicesPending")}:{" "}
                      <span className="font-semibold text-brand">
                        {currencyFormatter.format(invoiceTotals.pending)}
                      </span>
                    </span>
                    <span className="text-ink-muted">
                      {t("clients.invoicesPaid")}:{" "}
                      <span className="font-semibold text-green-600">
                        {currencyFormatter.format(invoiceTotals.paid)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
              {selectedClient.recentInvoices.length > 0 ? (
                <div className="space-y-3">
                  {selectedClient.recentInvoices.map((inv) => (
                    <motion.div key={inv.id} variants={v.item}>
                      <div
                        onClick={() => router.push(`/dashboard/invoices?id=${inv.id}`)}
                        className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-0"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 shrink-0 text-ink-muted/60" />
                          <span className="shrink-0 font-medium">{inv.displayNumber}</span>
                          {inv.source === "UPLOADED" && (
                            <span className="shrink-0 rounded-full bg-ink-soft px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                              {t("clients.invoiceUploaded")}
                            </span>
                          )}
                          {inv.project && (
                            <span className="truncate rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                              {inv.project.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 pl-6 sm:gap-4 sm:pl-0">
                          <span className="text-xs text-ink-muted">
                            {invoiceDateFormatter.format(new Date(inv.issueDate))}
                          </span>
                          <span className="font-medium">
                            {currencyFormatter.format(inv.total)}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                              inv.status === "PAID"
                                ? "bg-green-100 text-green-700"
                                : inv.status === "SENT"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-ink-soft text-ink-muted"
                            }`}
                          >
                            {t(`clients.invoiceStatus.${inv.status}`)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {selectedClient.hasMoreInvoices && (
                    <button
                      type="button"
                      onClick={handleLoadMoreInvoices}
                      disabled={isLoadingMoreInvoices}
                      className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoadingMoreInvoices
                        ? t("clients.loadingMoreInvoices")
                        : t("clients.loadMoreInvoices")}
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-line bg-white/50 px-5 py-8 text-center text-sm text-ink-muted">
                  {t("clients.noInvoices")}
                </div>
              )}
            </motion.section>

            {isDetailLoading && (
              <motion.div variants={v.fadeUp} className="space-y-3">
                <div className="h-10 w-full animate-pulse rounded-2xl bg-ink-soft" />
                <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-ink-soft" />
              </motion.div>
            )}
          </motion.div>
        </div>

        <ClientFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleDialogSuccess}
          editingClient={editingClient}
        />
        {ConfirmDialogElement}
      </main>
    );
  }

  // ─── List View ───
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
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-2">
              <p className="text-xs uppercase text-ink-muted">
                {t("eyebrow")}
              </p>
              <h1 className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}>
                {t("clients.title")}
              </h1>
              <p className="max-w-xl text-sm text-ink-muted sm:text-base">
                {t("clients.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-3 self-start">
              {clientLimit?.max !== null && clientLimit?.max !== undefined && (
                <span className="rounded-full bg-ink-soft px-3 py-1 text-xs font-semibold text-ink-muted">
                  {clientLimit.current}/{clientLimit.max}
                </span>
              )}
              <button
                type="button"
                onClick={handleAdd}
                disabled={clientLimit ? !clientLimit.allowed : false}
                className="flex items-center gap-2 rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {t("clients.addClient")}
              </button>
            </div>
          </motion.section>

          {isLoading ? (
            <motion.div variants={v.fadeUp} className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-ink-soft" />
              ))}
            </motion.div>
          ) : clients.length === 0 ? (
            <motion.section
              variants={v.fadeUp}
              className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-line bg-white/50 py-16"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-soft">
                <Users className="h-6 w-6 text-ink-muted" />
              </div>
              <div className="text-center">
                <p className="font-semibold">{t("clients.emptyTitle")}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {t("clients.emptySubtitle")}
                </p>
              </div>
            </motion.section>
          ) : (
            <motion.section variants={v.fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <motion.div key={client.id} variants={v.item}>
                  <div
                    onClick={() => {
                      void openClientDetail(client.id);
                    }}
                    className="group relative h-full cursor-pointer rounded-2xl border border-line bg-white/80 px-5 py-4 transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: client.color ?? "#6B7280" }}
                        />
                        <div>
                          <p className="font-semibold">{client.name}</p>
                          {client.email && (
                            <p className="text-xs text-ink-muted">{client.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 pointer-events-none transition group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => handleEdit(client, e)}
                          aria-label={t("clients.editClient")}
                          className="rounded-lg p-1.5 text-ink-muted hover:bg-ink-soft hover:text-ink"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(client.id, e)}
                          aria-label={t("clients.deleteClient")}
                          className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {client.notes && (
                      <p className="mt-2 line-clamp-2 text-xs text-ink-muted">
                        {client.notes}
                      </p>
                    )}
                    <div className="mt-3 flex gap-3 text-xs text-ink-muted">
                      <span>{t("clients.projects", { count: client._count.projects })}</span>
                      <span>{t("clients.sessions", { count: client._count.workSessions })}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.section>
          )}
        </motion.div>
      </div>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
        editingClient={editingClient}
      />
      {ConfirmDialogElement}
    </main>
  );
}
