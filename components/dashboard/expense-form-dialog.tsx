"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExpenseSchema } from "@/types/expense-schema";
import { createExpense, updateExpense } from "@/server/actions/expenses";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ExpenseFormValues = z.infer<typeof ExpenseSchema>;

const COLOR_PALETTE = [
  "#F97316",
  "#14B8A6",
  "#8B5CF6",
  "#3B82F6",
  "#EF4444",
  "#F59E0B",
  "#EC4899",
  "#6366F1",
];

type ExpenseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingExpense?: {
    id: string;
    name: string;
    amount: number;
    recurrence: "MONTHLY" | "ANNUAL" | "ONE_TIME";
    category: string | null;
    notes: string | null;
    color: string | null;
    isActive: boolean;
    startDate: string;
  } | null;
};

export default function ExpenseFormDialog({
  open,
  onOpenChange,
  onSuccess,
  editingExpense,
}: ExpenseFormDialogProps) {
  const t = useTranslations("dashboard");
  const isEditing = !!editingExpense;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      name: "",
      amount: 0,
      recurrence: "MONTHLY",
      category: "",
      notes: "",
      color: COLOR_PALETTE[0],
      isActive: true,
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: editingExpense?.name ?? "",
        amount: editingExpense?.amount ?? 0,
        recurrence: editingExpense?.recurrence ?? "MONTHLY",
        category: editingExpense?.category ?? "",
        notes: editingExpense?.notes ?? "",
        color: editingExpense?.color ?? COLOR_PALETTE[0],
        isActive: editingExpense?.isActive ?? true,
        startDate: editingExpense?.startDate
          ? new Date(editingExpense.startDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, editingExpense, form]);

  const { execute: executeCreate, status: createStatus } = useAction(
    createExpense,
    {
      onSuccess: () => {
        toast.success(t("expenses.created"));
        form.reset();
        onOpenChange(false);
        onSuccess();
      },
    }
  );

  const { execute: executeUpdate, status: updateStatus } = useAction(
    updateExpense,
    {
      onSuccess: () => {
        toast.success(t("expenses.updated"));
        form.reset();
        onOpenChange(false);
        onSuccess();
      },
    }
  );

  const isLoading = createStatus === "executing" || updateStatus === "executing";

  const onSubmit = (values: ExpenseFormValues) => {
    if (isEditing && editingExpense) {
      executeUpdate({ id: editingExpense.id, ...values });
    } else {
      executeCreate(values);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-line sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("expenses.editExpense") : t("expenses.addExpense")}
          </DialogTitle>
          <DialogDescription className="text-ink-muted">
            {t("expenses.pageSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("expenses.name")}
            </label>
            <Input
              {...form.register("name")}
              placeholder="Figma, GitHub Copilot..."
              className="rounded-xl"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Amount + Recurrence */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-ink-muted">
                {t("expenses.amount")}
              </label>
              <Input
                {...form.register("amount", { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="9.99"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-ink-muted">
                {t("expenses.recurrence")}
              </label>
              <Select
                value={form.watch("recurrence")}
                onValueChange={(v) =>
                  form.setValue(
                    "recurrence",
                    v as "MONTHLY" | "ANNUAL" | "ONE_TIME"
                  )
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">
                    {t("expenses.monthly")}
                  </SelectItem>
                  <SelectItem value="ANNUAL">
                    {t("expenses.annual")}
                  </SelectItem>
                  <SelectItem value="ONE_TIME">
                    {t("expenses.oneTime")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("expenses.category")}
            </label>
            <Input
              {...form.register("category")}
              placeholder={t("expenses.categoryPlaceholder")}
              className="rounded-xl"
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("expenses.color")}
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => form.setValue("color", hex)}
                  className={`h-7 w-7 rounded-full transition-all ${
                    form.watch("color") === hex
                      ? "ring-2 ring-offset-2 ring-ink/40 scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Start date */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("expenses.startDate")}
            </label>
            <Input
              {...form.register("startDate")}
              type="date"
              className="rounded-xl"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("expenses.notes")}
            </label>
            <Textarea
              {...form.register("notes")}
              placeholder="..."
              className="rounded-xl"
              rows={2}
            />
          </div>

          {/* Actions */}
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
              {t("expenses.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
