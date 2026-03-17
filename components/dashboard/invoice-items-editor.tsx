"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { computeInvoiceTotals } from "@/lib/invoice-helpers";

export type InvoiceItemRow = {
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

type InvoiceItemsEditorProps = {
  items: InvoiceItemRow[];
  taxRate: number;
  onChange: (items: InvoiceItemRow[]) => void;
  onTaxRateChange: (rate: number) => void;
};

export default function InvoiceItemsEditor({
  items,
  taxRate,
  onChange,
  onTaxRateChange,
}: InvoiceItemsEditorProps) {
  const t = useTranslations("dashboard.invoices.items");

  const updateItem = (index: number, field: keyof InvoiceItemRow, value: string | number) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  const addItem = () => {
    onChange([...items, { category: "", description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  const totals = computeInvoiceTotals(items, taxRate);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="hidden gap-3 text-xs uppercase text-ink-muted sm:grid sm:grid-cols-[1fr_2fr_0.7fr_0.9fr_0.8fr_auto]">
        <span>{t("category")}</span>
        <span>{t("description")}</span>
        <span>{t("quantity")}</span>
        <span>{t("unitPrice")}</span>
        <span>{t("amount")}</span>
        <span className="w-8" />
      </div>

      {/* Items */}
      {items.map((item, index) => {
        const amount = Math.round(item.quantity * item.unitPrice * 100) / 100;
        return (
          <div
            key={index}
            className="grid gap-2 rounded-2xl border border-line bg-white/70 p-3 sm:grid-cols-[1fr_2fr_0.7fr_0.9fr_0.8fr_auto] sm:items-center sm:gap-3 sm:p-2"
          >
            <Input
              placeholder={t("category")}
              value={item.category}
              onChange={(e) => updateItem(index, "category", e.target.value)}
              className="border-line bg-white/60 text-sm"
            />
            <Input
              placeholder={t("description")}
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              className="border-line bg-white/60 text-sm"
            />
            <Input
              type="number"
              min={0.01}
              step={0.01}
              value={item.quantity}
              onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
              className="border-line bg-white/60 text-sm"
            />
            <Input
              type="number"
              min={0}
              step={0.01}
              value={item.unitPrice}
              onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
              className="border-line bg-white/60 text-sm"
            />
            <div className="flex items-center text-sm font-semibold">
              {amount.toFixed(2)}
            </div>
            <button
              type="button"
              onClick={() => removeItem(index)}
              disabled={items.length <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-muted transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      {/* Add item */}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 rounded-2xl border border-dashed border-line px-4 py-2.5 text-sm text-ink-muted transition hover:border-line-strong hover:bg-white/60"
      >
        <Plus className="h-4 w-4" />
        {t("addItem")}
      </button>

      {/* Totals */}
      <div className="mt-2 space-y-2 rounded-2xl border border-line bg-panel px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">{t("subtotal")}</span>
          <span className="font-semibold">{totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-ink-muted">{t("taxRate")}</span>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={taxRate}
            onChange={(e) => onTaxRateChange(parseFloat(e.target.value) || 0)}
            className="w-24 border-line bg-white/60 text-right text-sm"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">{t("taxAmount")}</span>
          <span>{totals.taxAmount.toFixed(2)}</span>
        </div>
        <div className="border-t border-line pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{t("total")}</span>
            <span className="text-lg font-semibold">{totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
