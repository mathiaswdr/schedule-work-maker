"use client";

import dynamic from "next/dynamic";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { EASE, pickVariants } from "@/lib/motion-variants";
import { useAction } from "next-safe-action/hooks";
import {
  ArrowLeft,
  Download,
  FileText,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Upload,
} from "lucide-react";
import {
  deleteExpense,
  deleteExpenseInvoice,
} from "@/server/actions/expenses";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

const ExpenseFormDialog = dynamic(
  () => import("@/components/dashboard/expense-form-dialog")
);
const ExpenseInvoiceDialog = dynamic(
  () => import("@/components/dashboard/expense-invoice-dialog")
);

// ── Types ──

type ExpenseInvoiceItem = {
  id: string;
  invoiceNumber: string | null;
  amount: number | null;
  billedAt: string;
  notes: string | null;
  fileUrl: string;
  fileName: string | null;
  createdAt: string;
};

type ExpenseInvoiceSummaryItem = {
  id: string;
  amount: number | null;
  billedAt: string;
};

type ExpenseItem = {
  id: string;
  name: string;
  amount: number;
  recurrence: "MONTHLY" | "ANNUAL" | "ONE_TIME";
  category: string | null;
  notes: string | null;
  color: string | null;
  isActive: boolean;
  startDate: string;
  invoices: ExpenseInvoiceSummaryItem[];
};

type ExpenseDetail = Omit<ExpenseItem, "invoices"> & {
  invoices: ExpenseInvoiceItem[];
};

type ExpensesClientProps = {
  displayClassName: string;
  currency: string;
  initialExpenses?: ExpenseItem[];
  initialExpenseId?: string;
  initialExpenseDetail?: ExpenseDetail | null;
};

// ── Donut colors ──

const DONUT_COLORS = [
  "#F97316",
  "#14B8A6",
  "#8B5CF6",
  "#3B82F6",
  "#EF4444",
  "#F59E0B",
  "#EC4899",
  "#6366F1",
];

type ChartTypeFilter = "ALL" | "SUBSCRIPTIONS" | "ONE_TIME";
type ChartPeriodFilter =
  | "LAST_90_DAYS"
  | "THIS_MONTH"
  | "THIS_YEAR"
  | "PREVIOUS_YEAR";

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Component ──

export default function ExpensesClient({
  displayClassName,
  currency,
  initialExpenses,
  initialExpenseId,
  initialExpenseDetail,
}: ExpensesClientProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { confirm, ConfirmDialogElement } = useConfirm();
  const hasInitialExpenses = initialExpenses !== undefined;
  const hasInitialDetail = initialExpenseDetail !== undefined;
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses ?? []);
  const [isLoading, setIsLoading] = useState(!hasInitialExpenses && !hasInitialDetail);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [pendingInvoiceFile, setPendingInvoiceFile] = useState<File | null>(
    null
  );
  const [isInvoiceDragging, setIsInvoiceDragging] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(
    null
  );
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);

  // Detail view
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDetail | null>(
    initialExpenseDetail ?? null
  );
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [chartTypeFilter, setChartTypeFilter] =
    useState<ChartTypeFilter>("ALL");
  const [chartPeriodFilter, setChartPeriodFilter] =
    useState<ChartPeriodFilter>("LAST_90_DAYS");
  const expenseDetailCacheRef = useRef(new Map<string, ExpenseDetail>());

  // ── Actions ──

  const { execute: executeDelete } = useAction(deleteExpense, {
    onSuccess: () => {
      toast.success(t("expenses.deleted"));
      setSelectedExpense(null);
      expenseDetailCacheRef.current.clear();
      fetchExpenses();
    },
  });

  const { execute: executeDeleteInvoice } = useAction(deleteExpenseInvoice, {
    onSuccess: () => {
      toast.success(t("expenses.invoiceDeleted"));
      if (selectedExpense) {
        expenseDetailCacheRef.current.delete(selectedExpense.id);
      }
      if (selectedExpense) fetchExpenseDetail(selectedExpense.id);
    },
  });

  // ── Data fetching ──

  const fetchExpenses = async () => {
    const response = await fetch("/api/expenses", { cache: "no-store" });
    const payload = await response.json();
    expenseDetailCacheRef.current.clear();
    setExpenses(payload.expenses);
  };

  const fetchExpenseDetail = async (id: string) => {
    const cached = expenseDetailCacheRef.current.get(id);

    if (cached) {
      startTransition(() => {
        setSelectedExpense(cached);
      });
      return cached;
    }

    setIsDetailLoading(true);
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = await response.json();
      if (payload.expense) {
        expenseDetailCacheRef.current.set(id, payload.expense);
      }
      setSelectedExpense(payload.expense);
      return payload.expense as ExpenseDetail | undefined;
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    if (hasInitialExpenses || hasInitialDetail) return;

    let isMounted = true;
    fetchExpenses()
      .catch(() => null)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [hasInitialDetail, hasInitialExpenses]);

  useEffect(() => {
    if (!initialExpenseId || initialExpenseDetail) return;
    fetchExpenseDetail(initialExpenseId).catch(() => null);
  }, [initialExpenseDetail, initialExpenseId]);

  useEffect(() => {
    if (!initialExpenseDetail) return;
    expenseDetailCacheRef.current.set(initialExpenseDetail.id, initialExpenseDetail);
  }, [initialExpenseDetail]);

  // ── Handlers ──

  const handleEdit = (expense: ExpenseItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingExpense(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const ok = await confirm({
      title: t("expenses.editExpense"),
      description: t("expenses.deleteConfirm"),
      confirmLabel: tc("delete"),
      cancelLabel: tc("cancel"),
    });
    if (ok) executeDelete({ id });
  };

  const handleDialogSuccess = () => {
    expenseDetailCacheRef.current.clear();
    fetchExpenses();
    if (selectedExpense) fetchExpenseDetail(selectedExpense.id);
  };

  const handleInvoiceDialogSuccess = () => {
    setPendingInvoiceFile(null);
    expenseDetailCacheRef.current.clear();
    fetchExpenses();
    if (selectedExpense) fetchExpenseDetail(selectedExpense.id);
  };

  const handleBack = () => {
    setInvoiceDialogOpen(false);
    setPendingInvoiceFile(null);
    setSelectedExpense(null);
    router.push("/dashboard/expenses");
  };

  const handleInvoiceDialogOpenChange = (open: boolean) => {
    setInvoiceDialogOpen(open);
    if (!open) {
      setPendingInvoiceFile(null);
    }
  };

  const queueInvoiceFile = (file?: File | null) => {
    if (!file) return;

    const acceptedMimeList = ["application/pdf", "image/jpeg", "image/png"];
    if (!acceptedMimeList.includes(file.type)) {
      toast.error("PDF, JPG, PNG");
      return;
    }

    setPendingInvoiceFile(file);
    setInvoiceDialogOpen(true);
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
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale]
  );

  // ── Stats ──

  const monthlyTotal = useMemo(() => {
    return expenses
      .filter((e) => e.isActive && e.recurrence !== "ONE_TIME")
      .reduce((sum, e) => {
        return sum + (e.recurrence === "ANNUAL" ? e.amount / 12 : e.amount);
      }, 0);
  }, [expenses]);

  const annualTotal = useMemo(() => {
    return expenses
      .filter((e) => e.isActive && e.recurrence !== "ONE_TIME")
      .reduce((sum, e) => {
        return sum + (e.recurrence === "MONTHLY" ? e.amount * 12 : e.amount);
      }, 0);
  }, [expenses]);

  const activeCount = useMemo(() => {
    return expenses.filter(
      (e) => e.isActive && e.recurrence !== "ONE_TIME"
    ).length;
  }, [expenses]);

  const avgPerSubscription = useMemo(() => {
    return activeCount > 0 ? monthlyTotal / activeCount : 0;
  }, [monthlyTotal, activeCount]);

  const previousYear = useMemo(() => new Date().getFullYear() - 1, []);

  const chartRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now);

    switch (chartPeriodFilter) {
      case "THIS_MONTH":
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end,
        };
      case "THIS_YEAR":
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end,
        };
      case "PREVIOUS_YEAR":
        return {
          start: new Date(previousYear, 0, 1),
          end: new Date(previousYear, 11, 31, 23, 59, 59, 999),
        };
      case "LAST_90_DAYS":
      default:
        return {
          start: new Date(now.getTime() - 89 * DAY_MS),
          end,
        };
    }
  }, [chartPeriodFilter, previousYear]);

  const chartPeriodLabel = useMemo(() => {
    switch (chartPeriodFilter) {
      case "THIS_MONTH":
        return t("expenses.filters.period.thisMonth");
      case "THIS_YEAR":
        return t("expenses.filters.period.thisYear");
      case "PREVIOUS_YEAR":
        return String(previousYear);
      case "LAST_90_DAYS":
      default:
        return t("expenses.filters.period.last90Days");
    }
  }, [chartPeriodFilter, previousYear, t]);

  const chartSegments = useMemo(() => {
    const CIRCUMFERENCE = 2 * Math.PI * 80;

    const isWithinRange = (value: Date) =>
      value >= chartRange.start && value <= chartRange.end;

    const countOccurrences = (
      seed: Date,
      increment: "month" | "year",
      rangeStart: Date,
      rangeEnd: Date
    ) => {
      let count = 0;
      const cursor = new Date(seed);
      cursor.setHours(0, 0, 0, 0);

      while (cursor <= rangeEnd) {
        if (cursor >= rangeStart) count += 1;
        if (increment === "month") {
          cursor.setMonth(cursor.getMonth() + 1);
        } else {
          cursor.setFullYear(cursor.getFullYear() + 1);
        }
      }

      return count;
    };

    const filteredExpenses = expenses
      .filter((expense) => {
        if (chartTypeFilter === "SUBSCRIPTIONS") {
          return expense.recurrence !== "ONE_TIME";
        }
        if (chartTypeFilter === "ONE_TIME") {
          return expense.recurrence === "ONE_TIME";
        }
        return true;
      })
      .map((expense, index) => {
        const invoicesTotal = expense.invoices.reduce((sum, invoice) => {
          const billedAt = new Date(invoice.billedAt);
          if (!isWithinRange(billedAt)) return sum;
          return sum + (invoice.amount ?? expense.amount);
        }, 0);

        let fallbackTotal = 0;
        const startDate = new Date(expense.startDate);

        if (invoicesTotal === 0) {
          if (expense.recurrence === "ONE_TIME") {
            fallbackTotal = isWithinRange(startDate) ? expense.amount : 0;
          } else if (expense.isActive) {
            fallbackTotal =
              expense.recurrence === "MONTHLY"
                ? countOccurrences(
                    startDate,
                    "month",
                    chartRange.start,
                    chartRange.end
                  ) * expense.amount
                : countOccurrences(
                    startDate,
                    "year",
                    chartRange.start,
                    chartRange.end
                  ) * expense.amount;
          }
        }

        return {
          id: expense.id,
          name: expense.name,
          totalAmount: invoicesTotal || fallbackTotal,
          color:
            expense.color || DONUT_COLORS[index % DONUT_COLORS.length],
          recurrence: expense.recurrence,
        };
      })
      .filter((expense) => expense.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const total = filteredExpenses.reduce(
      (sum, expense) => sum + expense.totalAmount,
      0
    );

    let offset = 0;
    const segments = filteredExpenses.map((expense) => {
      const pct = total > 0 ? expense.totalAmount / total : 0;
      const length = pct * CIRCUMFERENCE;
      const segment = {
        ...expense,
        pct: Math.round(pct * 100),
        dashArray: `${length} ${CIRCUMFERENCE - length}`,
        dashOffset: -offset,
      };
      offset += length;
      return segment;
    });

    return { total, segments };
  }, [chartRange.end, chartRange.start, chartTypeFilter, expenses]);

  const v = pickVariants(shouldReduceMotion);

  // ══════════════════════════════════════
  // ─── DETAIL VIEW ───
  // ══════════════════════════════════════

  if (selectedExpense) {
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
            key={selectedExpense.id}
          >
            {/* Header */}
            <motion.section variants={v.fadeUp} className="space-y-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("expenses.back")}
              </button>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
                    <Receipt className="h-6 w-6 text-brand" />
                  </div>
                  <div>
                    <h1
                      className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}
                    >
                      {selectedExpense.name}
                    </h1>
                    {selectedExpense.category && (
                      <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs text-brand">
                        {selectedExpense.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => handleEdit(selectedExpense)}
                    className="flex items-center gap-2 rounded-2xl border border-line bg-white/80 px-4 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-white hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("expenses.editExpense")}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(selectedExpense.id, e)}
                    className="flex items-center gap-2 rounded-2xl border border-line bg-white/80 px-4 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Info cards */}
            <motion.section
              variants={v.fadeUp}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("expenses.amount")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {currencyFormatter.format(selectedExpense.amount)}
                </p>
                <p className="text-xs text-ink-muted">
                  {selectedExpense.recurrence === "ONE_TIME"
                    ? t("expenses.singleCharge")
                    : selectedExpense.recurrence === "ANNUAL"
                    ? `~${currencyFormatter.format(selectedExpense.amount / 12)}${t("expenses.perMonth")}`
                    : `~${currencyFormatter.format(selectedExpense.amount * 12)}${t("expenses.perYear")}`}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("expenses.recurrence")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {selectedExpense.recurrence === "MONTHLY"
                    ? t("expenses.monthly")
                    : selectedExpense.recurrence === "ANNUAL"
                      ? t("expenses.annual")
                      : t("expenses.oneTime")}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("expenses.startDate")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {dateFormatter.format(new Date(selectedExpense.startDate))}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("expenses.invoiceCount")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {selectedExpense.invoices.length}
                </p>
                <p className="text-xs text-ink-muted">
                  {selectedExpense.invoices[0]
                    ? t("expenses.lastInvoiceDate").replace(
                        "__date__",
                        dateFormatter.format(
                          new Date(selectedExpense.invoices[0].billedAt)
                        )
                      )
                    : t("expenses.noInvoicesYet")}
                </p>
              </div>
            </motion.section>

            {/* Notes */}
            {selectedExpense.notes && (
              <motion.section variants={v.fadeUp}>
                <div className="rounded-3xl border border-line bg-white/80 p-6">
                  <p className="text-sm font-semibold">
                    {t("expenses.notes")}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-ink-muted">
                    {selectedExpense.notes}
                  </p>
                </div>
              </motion.section>
            )}

            {/* Invoices */}
            <motion.section variants={v.fadeUp} className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">{t("expenses.invoices")}</p>
                  <p className="text-xs text-ink-muted">
                    {selectedExpense.recurrence === "ONE_TIME"
                      ? t("expenses.oneTimeInvoiceSectionHint")
                      : t("expenses.invoiceSectionHint")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInvoiceDialogOpen(true)}
                  className="flex items-center gap-2 self-start rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:bg-brand/90"
                >
                  <Plus className="h-4 w-4" />
                  {selectedExpense.recurrence === "ONE_TIME"
                    ? t("expenses.addReceipt")
                    : t("expenses.addInvoice")}
                </button>
              </div>

              <input
                ref={invoiceFileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(event) => {
                  queueInvoiceFile(event.target.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />

              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsInvoiceDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsInvoiceDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  const relatedTarget = event.relatedTarget as Node | null;
                  if (!event.currentTarget.contains(relatedTarget)) {
                    setIsInvoiceDragging(false);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsInvoiceDragging(false);
                  queueInvoiceFile(event.dataTransfer.files?.[0] ?? null);
                }}
                onClick={() => invoiceFileInputRef.current?.click()}
                className={`group cursor-pointer rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
                  isInvoiceDragging
                    ? "border-brand bg-brand/[0.06]"
                    : "border-line bg-white/45 hover:border-brand/40 hover:bg-brand/[0.02]"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <Upload className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-medium text-ink">
                    {isInvoiceDragging
                      ? t("expenses.dropInvoiceHere")
                      : t("expenses.dropInvoice")}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {t("expenses.dropInvoiceHint")}
                  </p>
                </div>
              </div>

              {selectedExpense.invoices.length > 0 ? (
                <div className="space-y-3">
                  {selectedExpense.invoices.map((invoice) => (
                    <motion.div
                      key={invoice.id}
                      variants={v.item}
                      className="flex flex-col gap-4 rounded-2xl border border-line bg-white/70 px-4 py-4 text-sm sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-ink-muted/60" />
                        <div className="space-y-1">
                          <p className="font-medium">
                            {invoice.invoiceNumber ||
                              invoice.fileName ||
                              t("expenses.invoiceFallbackName")}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                            <span>
                              {dateFormatter.format(new Date(invoice.billedAt))}
                            </span>
                            {invoice.amount !== null && (
                              <span className="font-medium text-ink">
                                {currencyFormatter.format(invoice.amount)}
                              </span>
                            )}
                            {invoice.fileName && (
                              <span className="truncate">
                                {invoice.fileName}
                              </span>
                            )}
                          </div>
                          {invoice.notes && (
                            <p className="whitespace-pre-wrap text-xs text-ink-muted">
                              {invoice.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={invoice.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg p-1.5 text-ink-muted transition hover:bg-ink-soft hover:text-ink"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirm({
                              title: t("expenses.invoices"),
                              description: t("expenses.deleteInvoiceConfirm"),
                              confirmLabel: tc("delete"),
                              cancelLabel: tc("cancel"),
                            });
                            if (ok) executeDeleteInvoice({ id: invoice.id });
                          }}
                          className="rounded-lg p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-line bg-white/40 px-4 py-8 text-center text-xs text-ink-muted">
                  {t("expenses.noInvoices")}
                </p>
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

        <ExpenseFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleDialogSuccess}
          editingExpense={editingExpense}
        />
        <ExpenseInvoiceDialog
          open={invoiceDialogOpen}
          onOpenChange={handleInvoiceDialogOpenChange}
          onSuccess={handleInvoiceDialogSuccess}
          expenseId={selectedExpense.id}
          expenseName={selectedExpense.name}
          defaultAmount={selectedExpense.amount}
          initialFile={pendingInvoiceFile}
        />
      </main>
    );
  }

  // ══════════════════════════════════════
  // ─── LIST VIEW ───
  // ══════════════════════════════════════

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
          <motion.section
            variants={v.fadeUp}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-2">
              <p className="text-xs uppercase text-ink-muted">
                {t("eyebrow")}
              </p>
              <h1
                className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}
              >
                {t("expenses.title")}
              </h1>
              <p className="max-w-xl text-sm text-ink-muted sm:text-base">
                {t("expenses.pageSubtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-2 self-start rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" />
              {t("expenses.addExpense")}
            </button>
          </motion.section>

          {/* Summary cards */}
          {!isLoading && expenses.length > 0 && (
            <motion.section
              variants={v.fadeUp}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("expenses.monthlyTotal")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {currencyFormatter.format(monthlyTotal)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("expenses.annualTotal")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {currencyFormatter.format(annualTotal)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("expenses.activeSubscriptions")}
                </p>
                <p className="mt-2 text-2xl font-semibold">{activeCount}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("expenses.avgPerSubscription")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {currencyFormatter.format(avgPerSubscription)}
                  <span className="text-sm font-normal text-ink-muted">
                    {t("expenses.perMonth")}
                  </span>
                </p>
              </div>
            </motion.section>
          )}

          {/* Expense list */}
          {isLoading ? (
            <motion.div variants={v.fadeUp} className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-ink-soft" />
              ))}
            </motion.div>
          ) : expenses.length === 0 ? (
            <motion.section
              variants={v.fadeUp}
              className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-line bg-white/50 py-16"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-soft">
                <Receipt className="h-6 w-6 text-ink-muted" />
              </div>
              <div className="text-center">
                <p className="font-semibold">{t("expenses.emptyTitle")}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {t("expenses.emptySubtitle")}
                </p>
              </div>
            </motion.section>
          ) : (
            <motion.section variants={v.fadeUp} className="space-y-3">
              {expenses.map((expense) => (
                <motion.div key={expense.id} variants={v.item}>
                <div
                  onClick={() => router.push(`/dashboard/expenses/${expense.id}`)}
                  className="group flex cursor-pointer items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3 transition hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${!expense.isActive ? "bg-ink-muted" : ""}`}
                      style={expense.isActive ? {
                        backgroundColor: expense.color || DONUT_COLORS[expenses.indexOf(expense) % DONUT_COLORS.length],
                      } : undefined}
                    />
                    <div>
                      <p className="font-medium">{expense.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {expense.category && (
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                            {expense.category}
                          </span>
                        )}
                        <span className="text-xs text-ink-muted">
                          {expense.recurrence === "MONTHLY"
                            ? t("expenses.monthly")
                            : expense.recurrence === "ANNUAL"
                              ? t("expenses.annual")
                              : t("expenses.oneTime")}
                        </span>
                        {!expense.isActive && expense.recurrence !== "ONE_TIME" && (
                          <span className="rounded-full bg-ink-soft px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                            {t("expenses.inactive")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">
                        {currencyFormatter.format(expense.amount)}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        {expense.recurrence === "ONE_TIME"
                          ? t("expenses.singleCharge")
                          : expense.recurrence === "ANNUAL"
                          ? `~${currencyFormatter.format(expense.amount / 12)}${t("expenses.perMonth")}`
                          : `~${currencyFormatter.format(expense.amount * 12)}${t("expenses.perYear")}`}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => handleEdit(expense, e)}
                        className="rounded-lg p-1.5 text-ink-muted hover:bg-ink-soft hover:text-ink"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(expense.id, e)}
                        className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                </motion.div>
              ))}
            </motion.section>
          )}

          {/* Filtered spend chart */}
          {!isLoading && (
            <motion.section variants={v.fadeUp}>
              <div className="rounded-3xl border border-line bg-white/80 p-6">
                <div className="mb-6 flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-semibold">
                      {t("expenses.filteredChartTitle")}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {t("expenses.filteredChartSubtitle").replace(
                        "__period__",
                        chartPeriodLabel
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          ["ALL", t("expenses.filters.type.all")],
                          [
                            "SUBSCRIPTIONS",
                            t("expenses.filters.type.subscriptions"),
                          ],
                          ["ONE_TIME", t("expenses.filters.type.oneTime")],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setChartTypeFilter(value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            chartTypeFilter === value
                              ? "bg-ink text-white"
                              : "bg-white text-ink-muted hover:bg-ink-soft hover:text-ink"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          [
                            "LAST_90_DAYS",
                            t("expenses.filters.period.last90Days"),
                          ],
                          [
                            "THIS_MONTH",
                            t("expenses.filters.period.thisMonth"),
                          ],
                          [
                            "THIS_YEAR",
                            t("expenses.filters.period.thisYear"),
                          ],
                          ["PREVIOUS_YEAR", String(previousYear)],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setChartPeriodFilter(value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            chartPeriodFilter === value
                              ? "bg-brand text-white"
                              : "bg-white text-ink-muted hover:bg-brand/10 hover:text-brand"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {chartSegments.segments.length > 0 ? (
                  <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr]">
                  <div className="relative mx-auto h-[200px] w-[200px]">
                    <svg
                      viewBox="0 0 200 200"
                      className="h-full w-full -rotate-90"
                    >
                      {chartSegments.segments.map((seg, i) => (
                        <motion.circle
                          key={seg.name}
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="36"
                          strokeDasharray={seg.dashArray}
                          strokeDashoffset={seg.dashOffset}
                          strokeLinecap="butt"
                          initial={{
                            opacity: 0,
                            strokeDasharray: `0 ${2 * Math.PI * 80}`,
                          }}
                          animate={{
                            opacity: 1,
                            strokeDasharray: seg.dashArray,
                          }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 0.8,
                            delay: shouldReduceMotion ? 0 : i * 0.1,
                            ease: EASE,
                          }}
                        />
                      ))}
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-lg font-bold">
                        {currencyFormatter.format(chartSegments.total)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {chartPeriodLabel}
                      </p>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-3">
                    {chartSegments.segments.map((seg) => (
                      <div
                        key={seg.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="text-sm">{seg.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">
                            {currencyFormatter.format(seg.totalAmount)}
                          </span>
                          <span className="w-10 text-right text-xs text-ink-muted">
                            {seg.pct}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-line bg-white/40 px-4 py-8 text-center text-sm text-ink-muted">
                    {t("expenses.filteredChartEmpty")}
                  </p>
                )}
              </div>
            </motion.section>
          )}
        </motion.div>
      </div>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
        editingExpense={editingExpense}
      />
      {ConfirmDialogElement}
    </main>
  );
}
