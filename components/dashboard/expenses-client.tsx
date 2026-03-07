"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { pickVariants } from "@/lib/motion-variants";
import { useAction } from "next-safe-action/hooks";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Upload,
} from "lucide-react";
import {
  deleteExpense,
  addExpenseReceipt,
  deleteExpenseReceipt,
} from "@/server/actions/expenses";
import ExpenseFormDialog from "@/components/dashboard/expense-form-dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

// ── Types ──

type ExpenseReceiptItem = {
  id: string;
  fileUrl: string;
  fileName: string | null;
  createdAt: string;
};

type ExpenseItem = {
  id: string;
  name: string;
  amount: number;
  recurrence: "MONTHLY" | "ANNUAL";
  category: string | null;
  notes: string | null;
  color: string | null;
  isActive: boolean;
  startDate: string;
};

type ExpenseDetail = ExpenseItem & {
  receipts: ExpenseReceiptItem[];
};

type ExpensesClientProps = {
  displayClassName: string;
  currency: string;
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

// ── Component ──

export default function ExpensesClient({
  displayClassName,
  currency,
}: ExpensesClientProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const { confirm, ConfirmDialogElement } = useConfirm();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(
    null
  );

  // Detail view
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDetail | null>(
    null
  );
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Receipt drag-and-drop
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

  // ── Actions ──

  const { execute: executeDelete } = useAction(deleteExpense, {
    onSuccess: () => {
      toast.success(t("expenses.deleted"));
      setSelectedExpense(null);
      fetchExpenses();
    },
  });

  const { execute: executeAddReceipt } = useAction(addExpenseReceipt, {
    onSuccess: () => {
      toast.success(t("expenses.receiptAdded"));
      if (selectedExpense) fetchExpenseDetail(selectedExpense.id);
    },
  });

  const { execute: executeDeleteReceipt } = useAction(deleteExpenseReceipt, {
    onSuccess: () => {
      toast.success(t("expenses.receiptDeleted"));
      if (selectedExpense) fetchExpenseDetail(selectedExpense.id);
    },
  });

  // ── Data fetching ──

  const fetchExpenses = async () => {
    const response = await fetch("/api/expenses", { cache: "no-store" });
    const payload = await response.json();
    setExpenses(payload.expenses);
  };

  const fetchExpenseDetail = async (id: string) => {
    setIsDetailLoading(true);
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = await response.json();
      setSelectedExpense(payload.expense);
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchExpenses()
      .catch(() => null)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

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
    fetchExpenses();
    if (selectedExpense) fetchExpenseDetail(selectedExpense.id);
  };

  const handleBack = () => {
    setSelectedExpense(null);
    fetchExpenses();
  };

  // ── Receipt upload ──

  const uploadReceiptFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("PDF, JPG, PNG");
        return;
      }
      if (!selectedExpense) return;
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "invoice");
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        if (data.url) {
          executeAddReceipt({
            expenseId: selectedExpense.id,
            fileUrl: data.url,
            fileName: file.name,
          });
        }
      } catch {
        toast.error("Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedExpense]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items?.length) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      const file = e.dataTransfer.files?.[0];
      if (file) uploadReceiptFile(file);
    },
    [uploadReceiptFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadReceiptFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadReceiptFile]
  );

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
      .filter((e) => e.isActive)
      .reduce((sum, e) => {
        return sum + (e.recurrence === "ANNUAL" ? e.amount / 12 : e.amount);
      }, 0);
  }, [expenses]);

  const annualTotal = useMemo(() => {
    return expenses
      .filter((e) => e.isActive)
      .reduce((sum, e) => {
        return sum + (e.recurrence === "MONTHLY" ? e.amount * 12 : e.amount);
      }, 0);
  }, [expenses]);

  const activeCount = useMemo(() => {
    return expenses.filter((e) => e.isActive).length;
  }, [expenses]);

  const avgPerSubscription = useMemo(() => {
    return activeCount > 0 ? monthlyTotal / activeCount : 0;
  }, [monthlyTotal, activeCount]);

  // ── Donut data (per expense) ──

  const donutSegments = useMemo(() => {
    if (monthlyTotal <= 0) return [];
    const CIRCUMFERENCE = 2 * Math.PI * 80; // radius = 80
    const activeExpenses = expenses
      .filter((e) => e.isActive)
      .map((e) => ({
        name: e.name,
        monthlyAmount: e.recurrence === "ANNUAL" ? e.amount / 12 : e.amount,
        color: e.color || DONUT_COLORS[expenses.indexOf(e) % DONUT_COLORS.length],
      }))
      .sort((a, b) => b.monthlyAmount - a.monthlyAmount);

    let offset = 0;
    return activeExpenses.map((item) => {
      const pct = item.monthlyAmount / monthlyTotal;
      const length = pct * CIRCUMFERENCE;
      const segment = {
        ...item,
        pct: Math.round(pct * 100),
        dashArray: `${length} ${CIRCUMFERENCE - length}`,
        dashOffset: -offset,
      };
      offset += length;
      return segment;
    });
  }, [expenses, monthlyTotal]);

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
              className="grid gap-4 sm:grid-cols-3"
            >
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {t("expenses.amount")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {currencyFormatter.format(selectedExpense.amount)}
                </p>
                <p className="text-xs text-ink-muted">
                  {selectedExpense.recurrence === "ANNUAL"
                    ? `~${currencyFormatter.format(selectedExpense.amount / 12)}${t("expenses.perMonth")}`
                    : `~${currencyFormatter.format(selectedExpense.amount * 12)}${t("expenses.perYear")}`}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {t("expenses.recurrence")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {selectedExpense.recurrence === "MONTHLY"
                    ? t("expenses.monthly")
                    : t("expenses.annual")}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {t("expenses.startDate")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {dateFormatter.format(new Date(selectedExpense.startDate))}
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

            {/* Receipts */}
            <motion.section variants={v.fadeUp} className="space-y-4">
              <p className="text-sm font-semibold">
                {t("expenses.receipts")}
              </p>

              {/* Drop zone */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInput}
                className="hidden"
              />

              <motion.div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className="group cursor-pointer"
              >
                <motion.div
                  animate={{
                    borderColor: isDragging
                      ? "rgb(249 115 22)"
                      : "rgb(229 231 235)",
                    backgroundColor: isDragging
                      ? "rgb(249 115 22 / 0.05)"
                      : "rgb(255 255 255 / 0.5)",
                    scale: isDragging ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border-2 border-dashed p-6 text-center transition-colors group-hover:border-brand/40 group-hover:bg-brand/[0.02]"
                >
                  <AnimatePresence mode="wait">
                    {isUploading ? (
                      <motion.div
                        key="uploading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center"
                      >
                        <Loader2 className="h-6 w-6 animate-spin text-brand" />
                        <p className="mt-2 text-sm font-medium text-brand">
                          {t("expenses.uploading")}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          animate={{
                            y: isDragging ? -4 : 0,
                            scale: isDragging ? 1.1 : 1,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                        >
                          <Upload
                            className={`h-6 w-6 transition-colors duration-200 ${
                              isDragging
                                ? "text-brand"
                                : "text-ink-muted/40 group-hover:text-ink-muted/60"
                            }`}
                          />
                        </motion.div>
                        {isDragging ? (
                          <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-sm font-semibold text-brand"
                          >
                            {t("expenses.dropReceiptHere")}
                          </motion.p>
                        ) : (
                          <>
                            <p className="mt-2 text-sm font-medium text-ink-muted/70">
                              {t("expenses.dropReceipt")}
                            </p>
                            <p className="mt-0.5 text-xs text-ink-muted/50">
                              PDF, JPG, PNG
                            </p>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Receipt list */}
              {selectedExpense.receipts.length > 0 ? (
                <div className="space-y-2">
                  {selectedExpense.receipts.map((receipt) => (
                    <motion.div
                      key={receipt.id}
                      variants={v.item}
                      className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-ink-muted/60" />
                        <div>
                          <p className="font-medium">
                            {receipt.fileName ||
                              receipt.fileUrl.split("/").pop()}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {dateFormatter.format(new Date(receipt.createdAt))}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={receipt.fileUrl}
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
                              title: t("expenses.receipts"),
                              description: t("expenses.deleteReceiptConfirm"),
                              confirmLabel: tc("delete"),
                              cancelLabel: tc("cancel"),
                            });
                            if (ok) executeDeleteReceipt({ id: receipt.id });
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
                !isUploading && (
                  <p className="text-center text-xs text-ink-muted">
                    {t("expenses.noReceipts")}
                  </p>
                )
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
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
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
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {t("expenses.monthlyTotal")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {currencyFormatter.format(monthlyTotal)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {t("expenses.annualTotal")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {currencyFormatter.format(annualTotal)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {t("expenses.activeSubscriptions")}
                </p>
                <p className="mt-2 text-2xl font-semibold">{activeCount}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
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
                <motion.div
                  key={expense.id}
                  variants={v.item}
                  onClick={() => fetchExpenseDetail(expense.id)}
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
                            : t("expenses.annual")}
                        </span>
                        {!expense.isActive && (
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
                        {expense.recurrence === "ANNUAL"
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
                </motion.div>
              ))}
            </motion.section>
          )}

          {/* Donut chart — category breakdown */}
          {donutSegments.length > 0 && (
            <motion.section variants={v.fadeUp}>
              <div className="rounded-3xl border border-line bg-white/80 p-6">
                <p className="mb-6 text-sm font-semibold">
                  {t("expenses.byCategory")}
                </p>
                <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr]">
                  {/* Donut SVG */}
                  <div className="relative mx-auto h-[200px] w-[200px]">
                    <svg
                      viewBox="0 0 200 200"
                      className="h-full w-full -rotate-90"
                    >
                      {donutSegments.map((seg, i) => (
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
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />
                      ))}
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-lg font-bold">
                        {currencyFormatter.format(monthlyTotal)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {t("expenses.perMonth")}
                      </p>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-3">
                    {donutSegments.map((seg) => (
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
                            {currencyFormatter.format(seg.monthlyAmount)}
                            <span className="text-xs font-normal text-ink-muted">
                              {t("expenses.perMonth")}
                            </span>
                          </span>
                          <span className="w-10 text-right text-xs text-ink-muted">
                            {seg.pct}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
