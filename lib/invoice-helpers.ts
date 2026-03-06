export function formatInvoiceNumber(n: number): string {
  return `INV-${String(n).padStart(3, "0")}`;
}

export type InvoiceTotals = {
  subtotal: number;
  taxAmount: number;
  total: number;
};

export function computeInvoiceTotals(
  items: { quantity: number; unitPrice: number }[],
  taxRate: number = 0
): InvoiceTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = taxRate > 0 ? Math.round(subtotal * (taxRate / 100) * 100) / 100 : 0;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return { subtotal: Math.round(subtotal * 100) / 100, taxAmount, total };
}
