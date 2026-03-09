"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type BankAccount = {
  id: string;
  label: string;
  bankName: string | null;
  iban: string;
  bic: string | null;
  isDefault: boolean;
};

type QrBillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceTotal: number;
  invoiceNumber: string;
  clientName: string | null;
  clientAddress: string | null;
  clientPostalCode: string | null;
  clientCity: string | null;
  clientCountry: string | null;
};

export default function QrBillDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceTotal,
  invoiceNumber,
  clientName,
  clientAddress,
  clientPostalCode,
  clientCity,
  clientCountry,
}: QrBillDialogProps) {
  const t = useTranslations("dashboard.invoices.qrBillDialog");
  const tf = useTranslations("dashboard.invoices.form");

  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");

  // Creditor fields (pre-filled from business profile)
  const [iban, setIban] = useState("");
  const [creditorName, setCreditorName] = useState("");
  const [creditorAddress, setCreditorAddress] = useState("");
  const [creditorPostalCode, setCreditorPostalCode] = useState("");
  const [creditorCity, setCreditorCity] = useState("");
  const [creditorCountry, setCreditorCountry] = useState("");

  // Debtor fields (pre-filled from invoice/client data)
  const [debtorName, setDebtorName] = useState("");
  const [debtorAddress, setDebtorAddress] = useState("");
  const [debtorPostalCode, setDebtorPostalCode] = useState("");
  const [debtorCity, setDebtorCity] = useState("");
  const [debtorCountry, setDebtorCountry] = useState("");

  // Amount & reference
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);

  // Load business profile + bank accounts on open
  useEffect(() => {
    if (!open) return;

    // Pre-fill debtor from props
    setDebtorName(clientName || "");
    setDebtorAddress(clientAddress || "");
    setDebtorPostalCode(clientPostalCode || "");
    setDebtorCity(clientCity || "");
    setDebtorCountry(clientCountry || "");
    setAmount(invoiceTotal > 0 ? String(invoiceTotal) : "");
    setReference(invoiceNumber || "");
    setSelectedBankAccountId("");
    setIban("");

    // Fetch business profile for creditor
    fetch("/api/business-profile")
      .then((r) => r.json())
      .then((data) => {
        const p = data.profile;
        if (!p) return;
        setCreditorName(p.companyName || "");
        setCreditorAddress(p.address || "");
        setCreditorPostalCode(p.postalCode || "");
        setCreditorCity(p.city || "");
        setCreditorCountry(p.country || "");
      })
      .catch(() => null);

    // Fetch bank accounts
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data) => {
        const accounts: BankAccount[] = data.bankAccounts || [];
        setBankAccounts(accounts);
        // Pre-select default account
        const defaultAccount = accounts.find((a) => a.isDefault);
        if (defaultAccount) {
          setSelectedBankAccountId(defaultAccount.id);
          setIban(defaultAccount.iban);
        }
      })
      .catch(() => null);
  }, [
    open,
    clientName,
    clientAddress,
    clientPostalCode,
    clientCity,
    clientCountry,
    invoiceTotal,
    invoiceNumber,
  ]);

  const handleSubmit = async () => {
    if (!iban || !creditorName || !creditorAddress || !creditorPostalCode || !creditorCity || !creditorCountry) {
      return;
    }

    setIsGenerating(true);
    try {
      const qrData = {
        iban,
        creditorName,
        creditorAddress,
        creditorZip: creditorPostalCode,
        creditorCity,
        creditorCountry,
        amount: amount ? parseFloat(amount) : undefined,
        debtorName: debtorName || undefined,
        debtorAddress: debtorAddress || undefined,
        debtorZip: debtorPostalCode || undefined,
        debtorCity: debtorCity || undefined,
        debtorCountry: debtorCountry || undefined,
        message: reference || undefined,
      };

      const res = await fetch(`/api/invoices/${invoiceId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "qrbill", qrData }),
      });

      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber || "invoice"}-qr.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      onOpenChange(false);
    } catch {
      toast.error("Download failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Creditor section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
              {t("creditor")}
            </p>
            <div className="space-y-3">
              {bankAccounts.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-ink-muted">
                    {tf("selectBankAccount")}
                  </label>
                  <Select
                    value={selectedBankAccountId}
                    onValueChange={(value) => {
                      setSelectedBankAccountId(value);
                      if (value !== "manual") {
                        const account = bankAccounts.find(
                          (a) => a.id === value
                        );
                        if (account) setIban(account.iban);
                      } else {
                        setIban("");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={tf("selectBankAccount")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">
                        {tf("manualEntry")}
                      </SelectItem>
                      {bankAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.label}
                          {a.isDefault
                            ? ` (${tf("defaultLabel")})`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs text-ink-muted">{t("iban")}</label>
                <Input
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="CH00 0000 0000 0000 0000 0"
                  className="border-line"
                  readOnly={
                    selectedBankAccountId !== "" &&
                    selectedBankAccountId !== "manual"
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-muted">{t("name")}</label>
                <Input
                  value={creditorName}
                  onChange={(e) => setCreditorName(e.target.value)}
                  className="border-line"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-muted">{t("address")}</label>
                <Input
                  value={creditorAddress}
                  onChange={(e) => setCreditorAddress(e.target.value)}
                  className="border-line"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-ink-muted">
                    {t("postalCode")}
                  </label>
                  <Input
                    value={creditorPostalCode}
                    onChange={(e) => setCreditorPostalCode(e.target.value)}
                    className="border-line"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-ink-muted">{t("city")}</label>
                  <Input
                    value={creditorCity}
                    onChange={(e) => setCreditorCity(e.target.value)}
                    className="border-line"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-ink-muted">
                    {t("country")}
                  </label>
                  <Input
                    value={creditorCountry}
                    onChange={(e) => setCreditorCountry(e.target.value)}
                    placeholder="CH"
                    className="border-line"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Debtor section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
              {t("debtor")}
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-ink-muted">{t("name")}</label>
                <Input
                  value={debtorName}
                  onChange={(e) => setDebtorName(e.target.value)}
                  className="border-line"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-muted">
                  {t("address")}
                </label>
                <Input
                  value={debtorAddress}
                  onChange={(e) => setDebtorAddress(e.target.value)}
                  className="border-line"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-ink-muted">
                    {t("postalCode")}
                  </label>
                  <Input
                    value={debtorPostalCode}
                    onChange={(e) => setDebtorPostalCode(e.target.value)}
                    className="border-line"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-ink-muted">{t("city")}</label>
                  <Input
                    value={debtorCity}
                    onChange={(e) => setDebtorCity(e.target.value)}
                    className="border-line"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-ink-muted">
                    {t("country")}
                  </label>
                  <Input
                    value={debtorCountry}
                    onChange={(e) => setDebtorCountry(e.target.value)}
                    placeholder="CH"
                    className="border-line"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Amount & Reference */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-ink-muted">{t("amount")}</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border-line"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-muted">
                {t("reference")}
              </label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="border-line"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isGenerating ||
                !iban ||
                !creditorName ||
                !creditorAddress ||
                !creditorPostalCode ||
                !creditorCity ||
                !creditorCountry
              }
              className="flex items-center gap-2 rounded-2xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isGenerating ? t("generating") : t("generate")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
