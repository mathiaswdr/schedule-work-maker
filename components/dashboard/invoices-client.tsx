"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { pickVariants } from "@/lib/motion-variants";
import {
  ArrowLeft,
  Download,
  FileText,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  Upload,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { deleteInvoice, updateInvoiceStatus } from "@/server/actions/invoices";
import { useConfirm } from "@/components/ui/confirm-dialog";
import InvoiceFormDialog from "@/components/dashboard/invoice-form-dialog";
import UploadInvoiceDialog from "@/components/dashboard/upload-invoice-dialog";
import QrBillDialog from "@/components/dashboard/qr-bill-dialog";

type InvoiceItem = {
  id: string;
  category: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
};

type InvoiceListItem = {
  id: string;
  number: number;
  displayNumber: string;
  status: "DRAFT" | "SENT" | "PAID";
  source: "GENERATED" | "UPLOADED";
  fileUrl: string | null;
  clientId: string | null;
  projectId: string | null;
  templateType: string;
  customTemplateId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientAddress: string | null;
  clientPostalCode: string | null;
  clientCity: string | null;
  clientCountry: string | null;
  senderName: string | null;
  senderAddress: string | null;
  senderSiret: string | null;
  senderEmail: string | null;
  senderPhone: string | null;
  senderLogoUrl: string | null;
  senderVatMention: string | null;
  location: string | null;
  title: string | null;
  subject: string | null;
  bankName: string | null;
  iban: string | null;
  bic: string | null;
  paymentTerms: string | null;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  subtotal: number;
  taxRate: number | null;
  taxAmount: number;
  total: number;
  items: InvoiceItem[];
  client: { name: string; color: string | null } | null;
  project: { name: string } | null;
};

type InvoicesClientProps = {
  displayClassName: string;
  userPlan?: string;
  invoiceLimit?: { allowed: boolean; current: number; max: number | null };
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-ink-soft text-ink-muted",
  SENT: "bg-brand/10 text-brand",
  PAID: "bg-brand-2/10 text-brand-2",
};

export default function InvoicesClient({
  displayClassName,
  userPlan,
  invoiceLimit,
}: InvoicesClientProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const { confirm, ConfirmDialogElement } = useConfirm();
  const searchParams = useSearchParams();

  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("id")
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceListItem | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploadFormOpen, setUploadFormOpen] = useState(false);
  const [editingUploadedInvoice, setEditingUploadedInvoice] =
    useState<InvoiceListItem | null>(null);
  const [qrBillDialogOpen, setQrBillDialogOpen] = useState(false);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [locale]
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale]
  );

  const fetchInvoices = async () => {
    const res = await fetch("/api/invoices", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices || []);
    }
  };

  useEffect(() => {
    fetchInvoices()
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, []);

  const { execute: execDelete } = useAction(deleteInvoice, {
    onSuccess: () => {
      toast.success(t("invoices.deleted"));
      setSelectedId(null);
      fetchInvoices();
    },
  });

  const { execute: execStatusUpdate } = useAction(updateInvoiceStatus, {
    onSuccess: () => {
      toast.success(t("invoices.statusUpdated"));
      fetchInvoices();
    },
  });

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t("invoices.deleteInvoice"),
      description: t("invoices.deleteConfirm"),
      confirmLabel: tc("delete"),
      cancelLabel: tc("cancel"),
    });
    if (ok) execDelete({ id });
  };

  const handleDownload = async (id: string, format: "pdf" | "docx" | "qrbill") => {
    setDownloading(format);
    try {
      const res = await fetch(`/api/invoices/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const inv = invoices.find((i) => i.id === id);
      const ext = format === "docx" ? ".docx" : ".pdf";
      const suffix = format === "qrbill" ? "-qr" : "";
      a.download = `${inv?.displayNumber ?? "invoice"}${suffix}${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const selected = invoices.find((i) => i.id === selectedId) ?? null;

  const filtered =
    statusFilter === "all"
      ? invoices
      : invoices.filter(
          (i) => i.status === statusFilter.toUpperCase()
        );

  // Group items by category
  const groupedItems = useMemo(() => {
    if (!selected) return [];
    const groups: { category: string; items: InvoiceItem[] }[] = [];
    for (const item of selected.items) {
      const cat = item.category || "";
      const existing = groups.find((g) => g.category === cat);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ category: cat, items: [item] });
      }
    }
    return groups;
  }, [selected]);

  const v = pickVariants(shouldReduceMotion);

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
          {/* ===== DETAIL VIEW ===== */}
          {selected ? (
            <>
              <motion.section variants={v.fadeUp}>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex items-center gap-2 text-sm text-ink-muted transition hover:text-ink"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("invoices.back")}
                </button>
              </motion.section>

              <motion.section
                variants={v.fadeUp}
                className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-center gap-4">
                  <h1
                    className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}
                  >
                    {selected.displayNumber}
                  </h1>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[selected.status]}`}
                  >
                    {t(`invoices.status.${selected.status}`)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selected.status === "DRAFT" && (
                    <button
                      type="button"
                      onClick={() =>
                        execStatusUpdate({
                          id: selected.id,
                          status: "SENT",
                        })
                      }
                      className="rounded-2xl border border-line-strong bg-white/80 px-3 py-2 text-xs font-semibold transition hover:bg-white"
                    >
                      {t("invoices.detail.markAsSent")}
                    </button>
                  )}
                  {selected.status === "SENT" && (
                    <button
                      type="button"
                      onClick={() =>
                        execStatusUpdate({
                          id: selected.id,
                          status: "PAID",
                        })
                      }
                      className="rounded-2xl border border-line-strong bg-white/80 px-3 py-2 text-xs font-semibold transition hover:bg-white"
                    >
                      {t("invoices.detail.markAsPaid")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (selected.source === "UPLOADED") {
                        setEditingUploadedInvoice(selected);
                        setUploadFormOpen(true);
                      } else {
                        setEditingInvoice(selected);
                        setFormOpen(true);
                      }
                    }}
                    className="rounded-2xl border border-line bg-white/80 px-3 py-2 text-xs text-ink-muted transition hover:bg-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selected.id)}
                    className="rounded-2xl border border-line bg-white/80 px-3 py-2 text-xs text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.section>

              {/* Summary cards */}
              <motion.section
                variants={v.fadeUp}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                {[
                  {
                    label: t("invoices.detail.client"),
                    value: selected.clientName || "—",
                  },
                  {
                    label: t("invoices.detail.issuedOn"),
                    value: dateFormatter.format(
                      new Date(selected.issueDate)
                    ),
                  },
                  {
                    label: t("invoices.items.subtotal"),
                    value: currencyFormatter.format(selected.subtotal),
                  },
                  {
                    label: t("invoices.items.total"),
                    value: currencyFormatter.format(selected.total),
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
                    <p className="mt-2 text-xl font-semibold">{card.value}</p>
                  </motion.div>
                ))}
              </motion.section>

              {/* Content: conditional on source */}
              {selected.source === "UPLOADED" ? (
                /* Uploaded invoice: file + notes */
                <motion.section variants={v.fadeUp} className="space-y-6">
                  <div className="rounded-3xl border border-line bg-white/80 p-6">
                    <p className="text-sm font-semibold">
                      {t("invoices.detail.uploadedFile")}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleDownload(selected.id, "pdf")}
                        disabled={downloading !== null}
                        className="flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:opacity-60"
                      >
                        <Download className="h-4 w-4" />
                        {downloading
                          ? t("invoices.download.generating")
                          : t("invoices.detail.downloadFile")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrBillDialogOpen(true)}
                        className="flex items-center gap-2 rounded-2xl border border-line-strong bg-white/80 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white"
                      >
                        <QrCode className="h-4 w-4" />
                        {t("invoices.detail.generateQrBill")}
                      </button>
                    </div>
                  </div>

                  {selected.notes && (
                    <div className="rounded-3xl border border-line bg-panel p-6">
                      <p className="text-sm font-semibold">
                        {t("invoices.notes")}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
                        {selected.notes}
                      </p>
                    </div>
                  )}
                </motion.section>
              ) : (
                /* Generated invoice: line items + downloads */
                <motion.section
                  variants={v.fadeUp}
                  className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
                >
                  <div className="rounded-3xl border border-line bg-white/80 p-6">
                    <p className="text-sm font-semibold">
                      {t("invoices.detail.lineItems")}
                    </p>
                    <motion.div
                      className="mt-4 space-y-4"
                      variants={v.list}
                    >
                      {groupedItems.map((group) => (
                        <div key={group.category}>
                          {group.category && (
                            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-ink-muted">
                              {group.category}
                            </p>
                          )}
                          {group.items.map((item) => (
                            <motion.div
                              key={item.id}
                              variants={v.item}
                              className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3 mb-2"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {item.description}
                                </p>
                                <p className="text-xs text-ink-muted">
                                  {item.quantity} x{" "}
                                  {currencyFormatter.format(item.unitPrice)}
                                </p>
                              </div>
                              <span className="text-sm font-semibold">
                                {currencyFormatter.format(item.amount)}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      ))}
                    </motion.div>

                    {/* Totals */}
                    <div className="mt-4 space-y-2 border-t border-line pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-ink-muted">
                          {t("invoices.items.subtotal")}
                        </span>
                        <span>
                          {currencyFormatter.format(selected.subtotal)}
                        </span>
                      </div>
                      {(selected.taxRate ?? 0) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-ink-muted">
                            {t("invoices.items.taxAmount")} ({selected.taxRate}%)
                          </span>
                          <span>
                            {currencyFormatter.format(selected.taxAmount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-semibold">
                        <span>{t("invoices.items.total")}</span>
                        <span>
                          {currencyFormatter.format(selected.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right panel: notes + downloads */}
                  <div className="space-y-6">
                    {selected.notes && (
                      <div className="rounded-3xl border border-line bg-panel p-6">
                        <p className="text-sm font-semibold">
                          {t("invoices.notes")}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
                          {selected.notes}
                        </p>
                      </div>
                    )}

                    <div className="rounded-3xl border border-line bg-white/80 p-6">
                      <p className="text-sm font-semibold">
                        {t("invoices.download.pdf")}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => handleDownload(selected.id, "pdf")}
                          disabled={downloading !== null}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:opacity-60"
                        >
                          <Download className="h-4 w-4" />
                          {downloading === "pdf"
                            ? t("invoices.download.generating")
                            : t("invoices.download.pdf")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(selected.id, "docx")}
                          disabled={downloading !== null}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-line-strong bg-white/80 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-60"
                        >
                          <Download className="h-4 w-4" />
                          {downloading === "docx"
                            ? t("invoices.download.generating")
                            : t("invoices.download.docx")}
                        </button>
                        {selected.iban && (
                          <button
                            type="button"
                            onClick={() => handleDownload(selected.id, "qrbill")}
                            disabled={downloading !== null}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-line-strong bg-white/80 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-60 sm:col-span-2"
                          >
                            <Download className="h-4 w-4" />
                            {downloading === "qrbill"
                              ? t("invoices.download.generating")
                              : t("invoices.download.qrbill")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </>
          ) : (
            /* ===== LIST VIEW ===== */
            <>
              <motion.section
                variants={v.fadeUp}
                className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                    {t("eyebrow")}
                  </p>
                  <h1
                    className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}
                  >
                    {t("invoices.title")}
                  </h1>
                  <p className="max-w-xl text-sm text-ink-muted sm:text-base">
                    {t("invoices.subtitle")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {invoiceLimit?.max !== null && invoiceLimit?.max !== undefined && (
                    <span className="rounded-full bg-ink-soft px-3 py-1 text-xs font-semibold text-ink-muted">
                      {invoiceLimit.current}/{invoiceLimit.max}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInvoice(null);
                      setFormOpen(true);
                    }}
                    disabled={invoiceLimit ? !invoiceLimit.allowed : false}
                    className="flex items-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {t("invoices.addInvoice")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUploadedInvoice(null);
                      setUploadFormOpen(true);
                    }}
                    disabled={invoiceLimit ? !invoiceLimit.allowed : false}
                    className="flex items-center gap-2 rounded-2xl border border-line-strong bg-white/80 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {t("invoices.uploadInvoice")}
                  </button>
                </div>
              </motion.section>

              {/* Status filters */}
              <motion.section variants={v.fadeUp}>
                <div className="flex gap-2">
                  {["all", "draft", "sent", "paid"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setStatusFilter(f)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        statusFilter === f
                          ? "bg-brand text-white"
                          : "bg-white/70 text-ink-muted border border-line hover:bg-white"
                      }`}
                    >
                      {t(`invoices.statusFilter.${f as "all" | "draft" | "sent" | "paid"}`)}
                    </button>
                  ))}
                </div>
              </motion.section>

              {/* Invoice grid */}
              <motion.section variants={v.fadeUp}>
                {filtered.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white/60 py-16">
                    <FileText className="mb-3 h-10 w-10 text-ink-muted opacity-40" />
                    <p className="text-sm font-semibold text-ink-muted">
                      {t("invoices.emptyTitle")}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {t("invoices.emptySubtitle")}
                    </p>
                  </div>
                ) : (
                  <motion.div
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    variants={v.list}
                  >
                    {filtered.map((inv) => (
                      <motion.div
                        key={inv.id}
                        variants={v.item}
                        onClick={() => setSelectedId(inv.id)}
                        className="group cursor-pointer rounded-2xl border border-line bg-white/80 p-5 transition hover:border-line-strong hover:shadow-[0_20px_40px_-32px_rgba(15,118,110,0.45)]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">
                              {inv.displayNumber}
                            </p>
                            {inv.source === "UPLOADED" && (
                              <span className="rounded-full bg-ink-soft px-2 py-0.5 text-[10px] text-ink-muted">
                                {t("invoices.uploaded")}
                              </span>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[inv.status]}`}
                          >
                            {t(`invoices.status.${inv.status}`)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          {inv.client?.color && (
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor: inv.client.color,
                              }}
                            />
                          )}
                          <span className="text-sm text-ink-muted">
                            {inv.clientName || "—"}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-ink-muted">
                            {dateFormatter.format(
                              new Date(inv.issueDate)
                            )}
                          </span>
                          <span className="text-sm font-semibold">
                            {currencyFormatter.format(inv.total)}
                          </span>
                        </div>

                        {/* Hover actions */}
                        <div className="mt-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (inv.source === "UPLOADED") {
                                setEditingUploadedInvoice(inv);
                                setUploadFormOpen(true);
                              } else {
                                setEditingInvoice(inv);
                                setFormOpen(true);
                              }
                            }}
                            className="rounded-xl border border-line bg-white px-2 py-1 text-xs text-ink-muted hover:bg-white/80"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(inv.id);
                            }}
                            className="rounded-xl border border-line bg-white px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.section>

              {isLoading && (
                <motion.div variants={v.fadeUp} className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-ink-soft" />
                  ))}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        invoice={
          editingInvoice
            ? {
                id: editingInvoice.id,
                clientId: editingInvoice.clientId,
                projectId: editingInvoice.projectId,
                issueDate: editingInvoice.issueDate,
                dueDate: editingInvoice.dueDate,
                notes: editingInvoice.notes,
                taxRate: editingInvoice.taxRate,
                location: editingInvoice.location,
                title: editingInvoice.title,
                subject: editingInvoice.subject,
                bankName: editingInvoice.bankName,
                iban: editingInvoice.iban,
                bic: editingInvoice.bic,
                paymentTerms: editingInvoice.paymentTerms,
                templateType: editingInvoice.templateType,
                customTemplateId: editingInvoice.customTemplateId,
                items: editingInvoice.items.map((i) => ({
                  category: i.category,
                  description: i.description,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                })),
              }
            : null
        }
        onSuccess={fetchInvoices}
      />

      <UploadInvoiceDialog
        open={uploadFormOpen}
        onOpenChange={setUploadFormOpen}
        invoice={
          editingUploadedInvoice
            ? {
                id: editingUploadedInvoice.id,
                fileUrl: editingUploadedInvoice.fileUrl,
                clientId: editingUploadedInvoice.clientId,
                projectId: editingUploadedInvoice.projectId,
                displayNumber: editingUploadedInvoice.displayNumber,
                total: editingUploadedInvoice.total,
                issueDate: editingUploadedInvoice.issueDate,
                dueDate: editingUploadedInvoice.dueDate,
                notes: editingUploadedInvoice.notes,
                status: editingUploadedInvoice.status,
              }
            : null
        }
        onSuccess={fetchInvoices}
      />
      {selected && (
        <QrBillDialog
          open={qrBillDialogOpen}
          onOpenChange={setQrBillDialogOpen}
          invoiceId={selected.id}
          invoiceTotal={selected.total}
          invoiceNumber={selected.displayNumber}
          clientName={selected.clientName}
          clientAddress={selected.clientAddress}
          clientPostalCode={selected.clientPostalCode}
          clientCity={selected.clientCity}
          clientCountry={selected.clientCountry}
        />
      )}
      {ConfirmDialogElement}
    </main>
  );
}
