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
  createBankAccount,
  updateBankAccount,
} from "@/server/actions/bank-accounts";
import { toast } from "sonner";

type BankAccountData = {
  id: string;
  label: string;
  bankName: string | null;
  iban: string;
  bic: string | null;
  isDefault: boolean;
};

type BankAccountFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: BankAccountData | null;
  onSuccess: () => void;
};

export default function BankAccountFormDialog({
  open,
  onOpenChange,
  account,
  onSuccess,
}: BankAccountFormDialogProps) {
  const t = useTranslations("dashboard.settingsPage.bankAccounts");

  const [label, setLabel] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (account) {
      setLabel(account.label);
      setBankName(account.bankName || "");
      setIban(account.iban);
      setBic(account.bic || "");
      setIsDefault(account.isDefault);
    } else {
      setLabel("");
      setBankName("");
      setIban("");
      setBic("");
      setIsDefault(false);
    }
  }, [open, account]);

  const { execute: execCreate, status: createStatus } = useAction(
    createBankAccount,
    {
      onSuccess: () => {
        toast.success(t("created"));
        onOpenChange(false);
        onSuccess();
      },
      onError: () => {
        toast.error(t("error"));
      },
    }
  );

  const { execute: execUpdate, status: updateStatus } = useAction(
    updateBankAccount,
    {
      onSuccess: () => {
        toast.success(t("updated"));
        onOpenChange(false);
        onSuccess();
      },
      onError: () => {
        toast.error(t("error"));
      },
    }
  );

  const isExecuting =
    createStatus === "executing" || updateStatus === "executing";

  const handleSubmit = () => {
    if (!label.trim() || !iban.trim()) return;

    const payload = {
      label: label.trim(),
      bankName: bankName.trim() || undefined,
      iban: iban.trim(),
      bic: bic.trim() || undefined,
      isDefault,
    };

    if (account) {
      execUpdate({ id: account.id, ...payload });
    } else {
      execCreate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {account ? t("editAccount") : t("addAccount")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              {t("label")}
            </label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("labelPlaceholder")}
              className="border-line"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              {t("bankName")}
            </label>
            <Input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder={t("bankNamePlaceholder")}
              className="border-line"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              {t("iban")}
            </label>
            <Input
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder={t("ibanPlaceholder")}
              className="border-line"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              {t("bic")}
            </label>
            <Input
              value={bic}
              onChange={(e) => setBic(e.target.value)}
              placeholder={t("bicPlaceholder")}
              className="border-line"
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-line bg-white/70 px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
            />
            <span className="text-sm">{t("defaultAccount")}</span>
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl border border-line-strong bg-white/80 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isExecuting || !label.trim() || !iban.trim()}
              className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {account ? t("update") : t("create")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
