"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import {
  ArrowLeft,
  Check,
  Download,
  Inbox,
  Loader2,
  Mail,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  ignoreDetectedInvoice,
  importDetectedInvoice,
} from "@/server/actions/email-invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/ui/confirm-dialog";

type EmailConnectionItem = {
  id: string;
  provider: "GMAIL" | "OUTLOOK";
  email: string;
  createdAt: string;
  updatedAt: string;
};

type DetectedInvoiceItem = {
  id: string;
  providerMessageId: string;
  sender: string | null;
  subject: string | null;
  receivedAt: string | null;
  attachmentFileName: string;
  attachmentStorageUrl: string | null;
  vendorName: string | null;
  invoiceDate: string | null;
  currency: string | null;
  totalAmount: number | null;
  confidenceScore: number;
  status: "PENDING" | "IMPORTED" | "IGNORED";
  createdExpenseId: string | null;
  emailConnection: {
    provider: "GMAIL" | "OUTLOOK";
    email: string;
  };
};

type FormState = {
  vendorName: string;
  amount: string;
  invoiceDate: string;
  category: string;
  notes: string;
};

type StatusFilter = "PENDING" | "IMPORTED" | "IGNORED" | "ALL";

type EmailInvoiceInboxClientProps = {
  displayClassName: string;
  currency: string;
  initialConnections: EmailConnectionItem[];
  initialDetectedInvoices: DetectedInvoiceItem[];
};

function toDateInput(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function buildFormState(invoice: DetectedInvoiceItem): FormState {
  return {
    vendorName: invoice.vendorName || invoice.sender || "",
    amount: invoice.totalAmount ? String(invoice.totalAmount) : "",
    invoiceDate: toDateInput(invoice.invoiceDate || invoice.receivedAt),
    category: "Email import",
    notes: invoice.subject || invoice.attachmentFileName,
  };
}

export default function EmailInvoiceInboxClient({
  displayClassName,
  currency,
  initialConnections,
  initialDetectedInvoices,
}: EmailInvoiceInboxClientProps) {
  const t = useTranslations("dashboard.emailInvoices");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { confirm, ConfirmDialogElement } = useConfirm();
  const [connections, setConnections] = useState(initialConnections);
  const [detectedInvoices, setDetectedInvoices] = useState(
    initialDetectedInvoices
  );
  const [filter, setFilter] = useState<StatusFilter>("PENDING");
  const [isScanning, setIsScanning] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [formState, setFormState] = useState<Record<string, FormState>>(() =>
    Object.fromEntries(
      initialDetectedInvoices.map((invoice) => [
        invoice.id,
        buildFormState(invoice),
      ])
    )
  );

  useEffect(() => {
    setConnections(initialConnections);
    setDetectedInvoices(initialDetectedInvoices);
    setFormState(
      Object.fromEntries(
        initialDetectedInvoices.map((invoice) => [
          invoice.id,
          buildFormState(invoice),
        ])
      )
    );
  }, [initialConnections, initialDetectedInvoices]);

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

  const filteredInvoices = useMemo(() => {
    if (filter === "ALL") return detectedInvoices;
    return detectedInvoices.filter((invoice) => invoice.status === filter);
  }, [detectedInvoices, filter]);

  const pendingCount = useMemo(
    () =>
      detectedInvoices.filter((invoice) => invoice.status === "PENDING").length,
    [detectedInvoices]
  );

  const { execute: executeIgnore, status: ignoreStatus } = useAction(
    ignoreDetectedInvoice,
    {
      onSuccess: () => {
        toast.success(t("ignored"));
        router.refresh();
      },
      onError: () => toast.error(t("actionError")),
    }
  );

  const { execute: executeImport, status: importStatus } = useAction(
    importDetectedInvoice,
    {
      onSuccess: () => {
        toast.success(t("imported"));
        router.refresh();
      },
      onError: () => toast.error(t("actionError")),
    }
  );

  const isActionLoading =
    ignoreStatus === "executing" || importStatus === "executing";

  const updateField = (
    invoiceId: string,
    field: keyof FormState,
    value: string
  ) => {
    setFormState((current) => ({
      ...current,
      [invoiceId]: {
        ...current[invoiceId],
        [field]: value,
      },
    }));
  };

  const scanNow = async () => {
    setIsScanning(true);
    try {
      const response = await fetch("/api/email-invoices/scan", {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Scan failed");
      }

      toast.success(t("scanComplete", { count: payload.created ?? 0 }));
      router.refresh();
    } catch {
      toast.error(t("scanError"));
    } finally {
      setIsScanning(false);
    }
  };

  const disconnectGmail = async () => {
    const ok = await confirm({
      title: t("disconnectTitle"),
      description: t("disconnectDescription"),
      confirmLabel: t("disconnect"),
      cancelLabel: tc("cancel"),
      variant: "destructive",
    });

    if (!ok) return;

    setIsDisconnecting(true);
    try {
      const response = await fetch("/api/email-invoices/disconnect", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Disconnect failed");
      toast.success(t("disconnected"));
      router.refresh();
    } catch {
      toast.error(t("actionError"));
    } finally {
      setIsDisconnecting(false);
    }
  };

  const ignoreInvoice = async (invoice: DetectedInvoiceItem) => {
    const ok = await confirm({
      title: t("ignoreTitle"),
      description: t("ignoreDescription"),
      confirmLabel: t("ignore"),
      cancelLabel: tc("cancel"),
      variant: "destructive",
    });

    if (ok) executeIgnore({ id: invoice.id });
  };

  const importInvoice = (invoice: DetectedInvoiceItem) => {
    const values = formState[invoice.id] ?? buildFormState(invoice);
    const amount = Number.parseFloat(values.amount.replace(",", "."));

    if (!values.vendorName.trim() || !Number.isFinite(amount)) {
      toast.error(t("missingFields"));
      return;
    }

    executeImport({
      id: invoice.id,
      vendorName: values.vendorName.trim(),
      amount,
      invoiceDate: values.invoiceDate || undefined,
      category: values.category || undefined,
      notes: values.notes || undefined,
    });
  };

  return (
    <main className="w-full">
      <div className="relative overflow-hidden rounded-[32px] border border-line bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,118,110,0.45)] sm:p-8">
        <div className="pointer-events-none absolute -top-24 right-[-6rem] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.18),transparent_60%)] blur-2xl" />
        <div className="relative z-10 space-y-8">
          <section className="space-y-4">
            <Link
              href="/dashboard/expenses"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </Link>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase text-ink-muted">
                  {t("eyebrow")}
                </p>
                <h1
                  className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}
                >
                  {t("title")}
                </h1>
                <p className="max-w-2xl text-sm text-ink-muted sm:text-base">
                  {t("subtitle")}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {connections.length > 0 ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={disconnectGmail}
                      disabled={isDisconnecting}
                      className="rounded-2xl border-line-strong bg-white/80"
                    >
                      {isDisconnecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      {t("disconnect")}
                    </Button>
                    <Button
                      type="button"
                      onClick={scanNow}
                      disabled={isScanning}
                      className="rounded-2xl bg-brand text-white hover:bg-brand/90"
                    >
                      {isScanning ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="mr-2 h-4 w-4" />
                      )}
                      {t("scan")}
                    </Button>
                  </>
                ) : (
                  <Button
                    asChild
                    className="rounded-2xl bg-brand text-white hover:bg-brand/90"
                  >
                    <a href="/api/email-invoices/connect/gmail">
                      <Mail className="mr-2 h-4 w-4" />
                      {t("connectGmail")}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-line bg-white/80 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t("privacyTitle")}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {t("privacyDescription")}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white/80 p-5">
              <p className="text-xs uppercase text-ink-muted">
                {t("connection")}
              </p>
              {connections.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-ink-soft px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {connection.email}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {connection.provider}
                        </p>
                      </div>
                      <Badge className="bg-brand/10 text-brand">
                        {t("connected")}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink-muted">
                  {t("noConnection")}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">{t("inboxTitle")}</p>
                <p className="text-xs text-ink-muted">
                  {t("pendingCount", { count: pendingCount })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["PENDING", "IMPORTED", "IGNORED", "ALL"] as const).map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        filter === value
                          ? "bg-ink text-white"
                          : "bg-white text-ink-muted hover:bg-ink-soft hover:text-ink"
                      }`}
                    >
                      {t(`filters.${value.toLowerCase()}`)}
                    </button>
                  )
                )}
              </div>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-line bg-white/50 px-6 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-soft text-ink-muted">
                  <Inbox className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-semibold">{t("emptyTitle")}</p>
                  <p className="mt-1 max-w-md text-sm text-ink-muted">
                    {connections.length > 0
                      ? t("emptyWithConnection")
                      : t("emptyWithoutConnection")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => {
                  const values = formState[invoice.id] ?? buildFormState(invoice);
                  const amountValue = Number.parseFloat(
                    values.amount.replace(",", ".")
                  );

                  return (
                    <article
                      key={invoice.id}
                      className="rounded-3xl border border-line bg-white/80 p-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              className={
                                invoice.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : invoice.status === "IMPORTED"
                                    ? "bg-teal-100 text-teal-800"
                                    : "bg-ink-soft text-ink-muted"
                              }
                            >
                              {t(`status.${invoice.status.toLowerCase()}`)}
                            </Badge>
                            <span className="text-xs text-ink-muted">
                              {invoice.emailConnection.email}
                            </span>
                            {invoice.receivedAt && (
                              <span className="text-xs text-ink-muted">
                                {dateFormatter.format(new Date(invoice.receivedAt))}
                              </span>
                            )}
                            <span className="text-xs text-ink-muted">
                              {t("confidence", {
                                value: Math.round(invoice.confidenceScore * 100),
                              })}
                            </span>
                          </div>

                          <div>
                            <p className="truncate font-semibold">
                              {invoice.subject || invoice.attachmentFileName}
                            </p>
                            <p className="mt-1 truncate text-xs text-ink-muted">
                              {invoice.sender || t("unknownSender")}
                            </p>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-ink-muted">
                                {t("vendor")}
                              </label>
                              <Input
                                value={values.vendorName}
                                onChange={(event) =>
                                  updateField(
                                    invoice.id,
                                    "vendorName",
                                    event.target.value
                                  )
                                }
                                disabled={invoice.status !== "PENDING"}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-ink-muted">
                                {t("amount")}
                              </label>
                              <Input
                                value={values.amount}
                                onChange={(event) =>
                                  updateField(
                                    invoice.id,
                                    "amount",
                                    event.target.value
                                  )
                                }
                                disabled={invoice.status !== "PENDING"}
                                inputMode="decimal"
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-ink-muted">
                                {t("date")}
                              </label>
                              <Input
                                type="date"
                                value={values.invoiceDate}
                                onChange={(event) =>
                                  updateField(
                                    invoice.id,
                                    "invoiceDate",
                                    event.target.value
                                  )
                                }
                                disabled={invoice.status !== "PENDING"}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-ink-muted">
                                {t("category")}
                              </label>
                              <Input
                                value={values.category}
                                onChange={(event) =>
                                  updateField(
                                    invoice.id,
                                    "category",
                                    event.target.value
                                  )
                                }
                                disabled={invoice.status !== "PENDING"}
                                className="rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-ink-muted">
                              {t("notes")}
                            </label>
                            <Textarea
                              value={values.notes}
                              onChange={(event) =>
                                updateField(
                                  invoice.id,
                                  "notes",
                                  event.target.value
                                )
                              }
                              disabled={invoice.status !== "PENDING"}
                              rows={2}
                              className="rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 xl:w-56 xl:flex-col">
                          {invoice.attachmentStorageUrl && (
                            <Button
                              asChild
                              variant="outline"
                              className="rounded-xl border-line bg-white"
                            >
                              <a
                                href={invoice.attachmentStorageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                {t("openFile")}
                              </a>
                            </Button>
                          )}
                          {invoice.status === "PENDING" ? (
                            <>
                              <Button
                                type="button"
                                onClick={() => importInvoice(invoice)}
                                disabled={isActionLoading}
                                className="rounded-xl bg-brand text-white hover:bg-brand/90"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                {Number.isFinite(amountValue)
                                  ? t("importWithAmount", {
                                      amount:
                                        currencyFormatter.format(amountValue),
                                    })
                                  : t("import")}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => ignoreInvoice(invoice)}
                                disabled={isActionLoading}
                                className="rounded-xl border-line bg-white text-ink-muted"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("ignore")}
                              </Button>
                            </>
                          ) : invoice.createdExpenseId ? (
                            <Button
                              asChild
                              variant="outline"
                              className="rounded-xl border-line bg-white"
                            >
                              <Link
                                href={`/dashboard/expenses/${invoice.createdExpenseId}`}
                              >
                                {t("viewExpense")}
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
      {ConfirmDialogElement}
    </main>
  );
}
