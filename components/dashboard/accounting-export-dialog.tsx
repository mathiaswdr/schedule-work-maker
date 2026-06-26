"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CalendarRange, Download, FileArchive, Lock } from "lucide-react";
import { toast } from "sonner";

import { buildSubscriptionCheckoutPath } from "@/lib/checkout-intent";
import { getPlanDisplayName, isPlanSufficient, type PlanId } from "@/lib/plans";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AccountingExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPlan: PlanId;
  currency: string;
};

type PeriodPreset = "month" | "quarter" | "year" | "custom";

type ExportSummary = {
  invoiceCount: number;
  expenseCount: number;
  totalInvoiced: number;
  totalInvoiceTax: number;
  totalPaid: number;
  totalExpenses: number;
};

export default function AccountingExportDialog({
  open,
  onOpenChange,
  userPlan,
  currency,
}: AccountingExportDialogProps) {
  const t = useTranslations("dashboard.accountingExport");
  const locale = useLocale();
  const isPro = isPlanSufficient(userPlan, "PRO");
  const [preset, setPreset] = useState<PeriodPreset>("quarter");
  const [customStart, setCustomStart] = useState(() => toInputDate(getQuarterRange().start));
  const [customEnd, setCustomEnd] = useState(() => toInputDate(getQuarterRange().end));
  const [summary, setSummary] = useState<ExportSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const period = useMemo(() => {
    if (preset === "month") return getMonthRange();
    if (preset === "quarter") return getQuarterRange();
    if (preset === "year") return getYearRange();

    return {
      start: parseInputDate(customStart) ?? getQuarterRange().start,
      end: parseInputDate(customEnd) ?? getQuarterRange().end,
    };
  }, [customEnd, customStart, preset]);

  const periodParams = useMemo(() => {
    return new URLSearchParams({
      start: toInputDate(period.start),
      end: toInputDate(period.end),
    });
  }, [period]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }),
    [currency, locale]
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale]
  );

  useEffect(() => {
    if (!open || !isPro) return;
    if (period.start > period.end) {
      setSummary(null);
      return;
    }

    const controller = new AbortController();
    setIsLoadingSummary(true);

    fetch(`/api/accounting-export/summary?${periodParams.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Summary failed");
        return response.json();
      })
      .then((payload) => setSummary(payload.summary ?? null))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setSummary(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingSummary(false);
      });

    return () => controller.abort();
  }, [isPro, open, period.end, period.start, periodParams]);

  const handleDownload = async () => {
    if (period.start > period.end) {
      toast.error(t("invalidPeriod"));
      return;
    }

    setIsDownloading(true);
    try {
      const params = new URLSearchParams(periodParams);
      params.set("locale", locale);
      const response = await fetch(`/api/accounting-export/download?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFilenameFromDisposition(response.headers.get("content-disposition"));
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t("downloadStarted"));
    } catch {
      toast.error(t("downloadFailed"));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-line bg-white p-0 sm:max-w-2xl">
        <div className="border-b border-line px-6 py-5">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <FileArchive className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">{t("title")}</DialogTitle>
            <DialogDescription>{t("subtitle")}</DialogDescription>
          </DialogHeader>
        </div>

        {!isPro ? (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink">{t("upgradeTitle")}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
              {t("upgradeDescription")}
            </p>
            <Link
              href={buildSubscriptionCheckoutPath("PRO")}
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:bg-brand/90"
            >
              {t("upgradeCta", { plan: getPlanDisplayName("PRO") })}
            </Link>
          </div>
        ) : (
          <div className="space-y-6 px-6 py-6">
            <section className="space-y-3">
              <p className="text-sm font-semibold text-ink">{t("period")}</p>
              <div className="grid gap-2 sm:grid-cols-4">
                {(["month", "quarter", "year", "custom"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPreset(value)}
                    className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
                      preset === value
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-white text-ink-muted hover:bg-ink-soft hover:text-ink"
                    }`}
                  >
                    {t(`presets.${value}`)}
                  </button>
                ))}
              </div>

              {preset === "custom" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="text-xs font-medium text-ink-muted">{t("startDate")}</span>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(event) => setCustomStart(event.target.value)}
                      className="w-full rounded-2xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-brand"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-xs font-medium text-ink-muted">{t("endDate")}</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(event) => setCustomEnd(event.target.value)}
                      className="w-full rounded-2xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-brand"
                    />
                  </label>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-ink-muted">
                <CalendarRange className="h-4 w-4 text-brand" />
                <span>
                  {dateFormatter.format(period.start)} - {dateFormatter.format(period.end)}
                </span>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{t("summary")}</p>
                {isLoadingSummary && (
                  <span className="text-xs text-ink-muted">{t("loadingSummary")}</span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryCard label={t("invoiceCount")} value={summary?.invoiceCount ?? 0} />
                <SummaryCard label={t("expenseCount")} value={summary?.expenseCount ?? 0} />
                <SummaryCard
                  label={t("totalInvoiced")}
                  value={currencyFormatter.format(summary?.totalInvoiced ?? 0)}
                />
                <SummaryCard
                  label={t("totalExpenses")}
                  value={currencyFormatter.format(summary?.totalExpenses ?? 0)}
                />
              </div>

              {summary && summary.invoiceCount === 0 && summary.expenseCount === 0 && (
                <p className="rounded-2xl border border-dashed border-line bg-white/60 px-4 py-3 text-sm text-ink-muted">
                  {t("emptyPeriod")}
                </p>
              )}
            </section>

            <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink-muted transition hover:bg-ink-soft hover:text-ink"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading || period.start > period.end}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? t("generating") : t("generate")}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-white/80 px-4 py-3">
      <p className="text-xs uppercase text-ink-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function getMonthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

function getQuarterRange() {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;

  return {
    start: new Date(now.getFullYear(), quarterStartMonth, 1),
    end: new Date(now.getFullYear(), quarterStartMonth + 3, 0),
  };
}

function getYearRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), 0, 1),
    end: new Date(now.getFullYear(), 11, 31),
  };
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getFilenameFromDisposition(disposition: string | null) {
  const match = disposition?.match(/filename="([^"]+)"/);
  return match?.[1] ?? "kronoma-export-comptable.zip";
}
