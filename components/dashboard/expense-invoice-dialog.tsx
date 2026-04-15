"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Paperclip, Upload } from "lucide-react";
import { addExpenseInvoice } from "@/server/actions/expenses";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ExpenseInvoiceFormSchema = z.object({
  invoiceNumber: z.string().max(100).optional(),
  amount: z.coerce.number().min(0),
  billedAt: z.string().min(1),
  notes: z.string().max(500).optional(),
});

type ExpenseInvoiceFormValues = z.infer<typeof ExpenseInvoiceFormSchema>;

type ExpenseInvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  expenseId: string;
  expenseName: string;
  defaultAmount: number;
  initialFile?: File | null;
};

export default function ExpenseInvoiceDialog({
  open,
  onOpenChange,
  onSuccess,
  expenseId,
  expenseName,
  defaultAmount,
  initialFile,
}: ExpenseInvoiceDialogProps) {
  const t = useTranslations("dashboard");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<ExpenseInvoiceFormValues>({
    resolver: zodResolver(ExpenseInvoiceFormSchema),
    defaultValues: {
      invoiceNumber: "",
      amount: defaultAmount,
      billedAt: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      invoiceNumber: "",
      amount: defaultAmount,
      billedAt: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setFile(initialFile ?? null);
  }, [defaultAmount, form, initialFile, open]);

  const { execute, status } = useAction(addExpenseInvoice, {
    onSuccess: () => {
      toast.success(t("expenses.invoiceAdded"));
      onOpenChange(false);
      onSuccess();
    },
  });

  const isLoading = isUploading || status === "executing";
  const acceptedMimeList = useMemo(
    () => ["application/pdf", "image/jpeg", "image/png"],
    []
  );

  const onSubmit = async (values: ExpenseInvoiceFormValues) => {
    if (!file) {
      toast.error(t("expenses.invoiceForm.fileRequired"));
      return;
    }

    if (!acceptedMimeList.includes(file.type)) {
      toast.error("PDF, JPG, PNG");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "invoice");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const payload = await response.json();

      execute({
        expenseId,
        invoiceNumber: values.invoiceNumber || undefined,
        amount: values.amount,
        billedAt: values.billedAt,
        notes: values.notes || undefined,
        fileUrl: payload.url,
        fileName: file.name,
      });
    } catch {
      toast.error(t("expenses.invoiceForm.uploadError"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelection = (nextFile?: File | null) => {
    if (!nextFile) return;

    if (!acceptedMimeList.includes(nextFile.type)) {
      toast.error("PDF, JPG, PNG");
      return;
    }

    setFile(nextFile);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-line sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("expenses.addInvoice")}</DialogTitle>
          <DialogDescription className="text-ink-muted">
            {t("expenses.invoiceForm.subtitle").replace("__name__", expenseName)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("expenses.invoiceForm.file")}
            </label>
            <label
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                const relatedTarget = event.relatedTarget as Node | null;
                if (!event.currentTarget.contains(relatedTarget)) {
                  setIsDragging(false);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                handleFileSelection(event.dataTransfer.files?.[0] ?? null);
              }}
              className={`flex cursor-pointer items-center justify-between rounded-2xl border border-dashed px-4 py-3 transition ${
                isDragging
                  ? "border-brand bg-brand/[0.06]"
                  : "border-line bg-white hover:border-brand/40 hover:bg-brand/[0.02]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  {isDragging ? (
                    <Upload className="h-4 w-4" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {file?.name ||
                      (isDragging
                        ? t("expenses.invoiceForm.dropFileHere")
                        : t("expenses.invoiceForm.filePlaceholder"))}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {isDragging
                      ? t("expenses.invoiceForm.dropFileHint")
                      : "PDF, JPG, PNG"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-brand">
                {t("expenses.invoiceForm.chooseFile")}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(event) =>
                  handleFileSelection(event.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-ink-muted">
                {t("expenses.invoiceForm.amount")}
              </label>
              <Input
                {...form.register("amount")}
                type="number"
                step="0.01"
                min="0"
                className="rounded-xl"
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-ink-muted">
                {t("expenses.invoiceForm.billedAt")}
              </label>
              <Input
                {...form.register("billedAt")}
                type="date"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("expenses.invoiceForm.invoiceNumber")}
            </label>
            <Input
              {...form.register("invoiceNumber")}
              placeholder={t("expenses.invoiceForm.invoiceNumberPlaceholder")}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("expenses.invoiceForm.notes")}
            </label>
            <Textarea
              {...form.register("notes")}
              rows={3}
              placeholder={t("expenses.invoiceForm.notesPlaceholder")}
              className="rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              {t("expenses.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-brand text-white hover:bg-brand/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("expenses.uploading")}
                </>
              ) : (
                t("expenses.invoiceForm.submit")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
