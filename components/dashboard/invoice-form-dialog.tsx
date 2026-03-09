"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvoice, updateInvoice } from "@/server/actions/invoices";
// import {
//   createInvoiceTemplate,
//   deleteInvoiceTemplate,
// } from "@/server/actions/invoice-templates";
import InvoiceItemsEditor, {
  type InvoiceItemRow,
} from "@/components/dashboard/invoice-items-editor";
import { toast } from "sonner";
// import { CloudinaryUploadButton } from "@/components/ui/cloudinary-upload-button";
// import { Trash2, Download, ChevronDown, ChevronUp } from "lucide-react";

type ClientOption = { id: string; name: string; color: string | null };
type ProjectOption = { id: string; name: string; clientId: string | null };
type BankAccountOption = { id: string; label: string; bankName: string | null; iban: string; bic: string | null; isDefault: boolean };
// type CustomTemplate = { id: string; name: string; fileUrl: string };

type InvoiceData = {
  id: string;
  clientId: string | null;
  projectId: string | null;
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
  taxRate: number | null;
  templateType: string;
  customTemplateId: string | null;
  items: {
    category: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
};

type InvoiceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: InvoiceData | null;
  onSuccess: () => void;
};

export default function InvoiceFormDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: InvoiceFormDialogProps) {
  const t = useTranslations("dashboard.invoices");
  const [step, setStep] = useState(0);

  // Form state
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState("");
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [items, setItems] = useState<InvoiceItemRow[]>([
    { category: "", description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [templateType, setTemplateType] = useState("CLASSIC");
  // const [customTemplateId, setCustomTemplateId] = useState<string | null>(null);
  // const [templateName, setTemplateName] = useState("");
  // const [uploading, setUploading] = useState(false);
  // const [showGuide, setShowGuide] = useState(false);

  // Data
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  // const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);

  // const fetchCustomTemplates = () => {
  //   fetch("/api/invoices/templates")
  //     .then((r) => r.json())
  //     .then((d) => setCustomTemplates(d.templates || []))
  //     .catch(() => null);
  // };

  useEffect(() => {
    if (!open) return;
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .catch(() => null);
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => null);
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((d) => setBankAccounts(d.bankAccounts || []))
      .catch(() => null);
    // fetchCustomTemplates();
  }, [open]);

  // Reset/populate form when opening
  useEffect(() => {
    if (!open) {
      setStep(0);
      return;
    }
    if (invoice) {
      setClientId(invoice.clientId || "");
      setProjectId(invoice.projectId || "");
      setIssueDate(invoice.issueDate.slice(0, 10));
      setDueDate(invoice.dueDate?.slice(0, 10) || "");
      setLocation(invoice.location || "");
      setTitle(invoice.title || "");
      setSubject(invoice.subject || "");
      setBankName(invoice.bankName || "");
      setIban(invoice.iban || "");
      setBic(invoice.bic || "");
      setPaymentTerms(invoice.paymentTerms || "");
      setSelectedBankAccountId("manual");
      setItems(
        invoice.items.map((i) => ({
          category: i.category || "",
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }))
      );
      setTaxRate(invoice.taxRate ?? 0);
      setNotes(invoice.notes || "");
      setTemplateType(invoice.templateType || "CLASSIC");
      // setCustomTemplateId(invoice.customTemplateId || null);
    } else {
      setClientId("");
      setProjectId("");
      setIssueDate(new Date().toISOString().slice(0, 10));
      setDueDate("");
      setLocation("");
      setTitle("");
      setSubject("");
      setBankName("");
      setIban("");
      setBic("");
      setPaymentTerms("");
      setSelectedBankAccountId("");
      setItems([{ category: "", description: "", quantity: 1, unitPrice: 0 }]);
      setTaxRate(0);
      setNotes("");
      setTemplateType("CLASSIC");
      // setCustomTemplateId(null);
    }
  }, [open, invoice]);

  // Pre-select default bank account for new invoices
  useEffect(() => {
    if (!open || invoice || bankAccounts.length === 0) return;
    if (selectedBankAccountId) return; // already selected
    const defaultAccount = bankAccounts.find((a) => a.isDefault);
    if (defaultAccount) {
      setSelectedBankAccountId(defaultAccount.id);
      setBankName(defaultAccount.bankName || "");
      setIban(defaultAccount.iban);
      setBic(defaultAccount.bic || "");
    }
  }, [open, invoice, bankAccounts, selectedBankAccountId]);

  const { execute: execCreate, status: createStatus } = useAction(
    createInvoice,
    {
      onSuccess: () => {
        toast.success(t("created"));
        onOpenChange(false);
        onSuccess();
      },
      onError: () => { toast.error(t("form.create")); },
    }
  );

  const { execute: execUpdate, status: updateStatus } = useAction(
    updateInvoice,
    {
      onSuccess: () => {
        toast.success(t("updated"));
        onOpenChange(false);
        onSuccess();
      },
      onError: () => { toast.error(t("form.update")); },
    }
  );

  // const { execute: execCreateTemplate } = useAction(createInvoiceTemplate, {
  //   onSuccess: () => {
  //     toast.success(t("template.templateUploaded"));
  //     setTemplateName("");
  //     fetchCustomTemplates();
  //   },
  //   onError: () => { toast.error(t("form.create")); },
  // });

  // const { execute: execDeleteTemplate } = useAction(deleteInvoiceTemplate, {
  //   onSuccess: () => {
  //     toast.success(t("template.templateDeleted"));
  //     fetchCustomTemplates();
  //     if (templateType === "CUSTOM") {
  //       setTemplateType("CLASSIC");
  //       setCustomTemplateId(null);
  //     }
  //   },
  //   onError: () => { toast.error(t("form.update")); },
  // });

  const isExecuting =
    createStatus === "executing" || updateStatus === "executing";

  const filteredProjects = clientId
    ? projects.filter(
        (p) => p.clientId === clientId || p.clientId === null
      )
    : projects;

  const handleSubmit = () => {
    const validItems = items.filter((i) => i.description.trim());
    if (!clientId || !validItems.length) return;

    const payload = {
      clientId,
      projectId: projectId && projectId !== "none" ? projectId : null,
      issueDate,
      dueDate: dueDate || null,
      location: location || undefined,
      title: title || undefined,
      subject: subject || undefined,
      bankName: bankName || undefined,
      iban: iban || undefined,
      bic: bic || undefined,
      paymentTerms: paymentTerms || undefined,
      notes: notes || undefined,
      taxRate,
      templateType: templateType as "CLASSIC" | "MODERN" | "MINIMAL",
      customTemplateId: null,
      items: validItems,
    };

    if (invoice) {
      execUpdate({ id: invoice.id, ...payload });
    } else {
      execCreate(payload);
    }
  };

  const steps = [t("form.stepClient"), t("form.stepItems"), t("form.stepFinalize")];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? t("editInvoice") : t("addInvoice")}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex gap-2">
          {steps.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                i === step
                  ? "bg-brand text-white"
                  : "bg-ink-soft text-ink-muted hover:bg-ink-soft/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Step 1: Client & Project */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {t("form.invoiceTitle")}
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("form.invoiceTitlePlaceholder")}
                  className="border-line"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {t("form.subject")}
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("form.subjectPlaceholder")}
                  className="border-line"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("form.selectClient")}
              </label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("form.selectClient")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        {c.color && (
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                        )}
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("form.selectProject")}
              </label>
              <Select
                value={projectId}
                onValueChange={setProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.noProject")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("form.noProject")}</SelectItem>
                  {filteredProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("form.location")}
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("form.locationPlaceholder")}
                className="border-line"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {t("form.issueDate")}
                </label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="border-line"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {t("form.dueDate")}
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="border-line"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={!clientId}
                className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("form.next")}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Line Items */}
        {step === 1 && (
          <div className="space-y-4">
            <InvoiceItemsEditor
              items={items}
              taxRate={taxRate}
              onChange={setItems}
              onTaxRateChange={setTaxRate}
            />
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="rounded-2xl border border-line-strong bg-white/80 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
              >
                {t("form.previous")}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!items.some((i) => i.description.trim())}
                className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("form.next")}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Notes & Template */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("notes")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={3}
                className="w-full rounded-2xl border border-line bg-white/60 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Payment terms */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("form.paymentTerms")}
              </label>
              <textarea
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder={t("form.paymentTermsPlaceholder")}
                rows={3}
                className="w-full rounded-2xl border border-line bg-white/60 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Banking info */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("form.bankingInfo")}
              </label>
              {bankAccounts.length > 0 && (
                <Select
                  value={selectedBankAccountId}
                  onValueChange={(value) => {
                    setSelectedBankAccountId(value);
                    if (value !== "manual") {
                      const account = bankAccounts.find((a) => a.id === value);
                      if (account) {
                        setBankName(account.bankName || "");
                        setIban(account.iban);
                        setBic(account.bic || "");
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("form.selectBankAccount")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">
                      {t("form.manualEntry")}
                    </SelectItem>
                    {bankAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label}
                        {a.isDefault ? ` (${t("form.defaultLabel")})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={t("form.bankNamePlaceholder")}
                  className="border-line"
                />
                <Input
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder={t("form.ibanPlaceholder")}
                  className="border-line"
                />
                <Input
                  value={bic}
                  onChange={(e) => setBic(e.target.value)}
                  placeholder={t("form.bicPlaceholder")}
                  className="border-line"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("template.title")}
              </label>

              {/* Built-in templates */}
              <div className="grid grid-cols-3 gap-3">
                {(["CLASSIC", "MODERN", "MINIMAL"] as const).map((tpl) => (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => {
                      setTemplateType(tpl);
                    }}
                    className={`rounded-2xl border p-4 text-center text-sm font-medium transition ${
                      templateType === tpl
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-line bg-white/70 text-ink-muted hover:border-line-strong"
                    }`}
                  >
                    {t(`template.${tpl.toLowerCase() as "classic" | "modern" | "minimal"}`)}
                  </button>
                ))}
              </div>

              {/* Custom templates section — temporarily hidden
              <div className="space-y-2">
                ...
              </div>
              */}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-2xl border border-line-strong bg-white/80 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
              >
                {t("form.previous")}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isExecuting}
                className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {invoice ? t("form.update") : t("form.create")}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
