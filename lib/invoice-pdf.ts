import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  formatInvoiceDate,
  getInvoiceTemplateMessages,
  type InvoiceLocale,
  normalizeInvoiceLocale,
} from "./invoice-i18n";

export type InvoiceData = {
  displayNumber: string;
  senderName: string | null;
  senderAddress: string | null;
  senderSiret: string | null;
  senderEmail: string | null;
  senderPhone: string | null;
  senderLogoUrl: string | null;
  senderPostalCode: string | null;
  senderCity: string | null;
  senderCountry: string | null;
  senderVatMention: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientAddress: string | null;
  clientPostalCode: string | null;
  clientCity: string | null;
  clientCountry: string | null;
  location: string | null;
  title: string | null;
  subject: string | null;
  bankName: string | null;
  iban: string | null;
  bic: string | null;
  paymentTerms: string | null;
  issueDate: Date | string;
  dueDate: Date | string | null;
  notes: string | null;
  subtotal: number;
  taxRate: number | null;
  taxAmount: number;
  total: number;
  templateType: string;
  items: {
    category: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
};

const fmt = (n: number) => n.toFixed(2);

// ─── Classic Template ───

const classicStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1D1B16" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  title: { fontSize: 22, fontWeight: "bold", fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#888", marginTop: 4 },
  senderBlock: { marginBottom: 20 },
  clientBlock: { marginBottom: 20, padding: 12, backgroundColor: "#F9FAFB", borderRadius: 4 },
  label: { fontSize: 8, color: "#888", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: "#F3F4F6" },
  colDesc: { flex: 3 },
  colQty: { flex: 0.8, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colAmount: { flex: 1, textAlign: "right" },
  category: { fontSize: 9, fontWeight: "bold", fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 4, color: "#555" },
  totalsBlock: { marginTop: 16, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 30, paddingVertical: 3, width: 200 },
  totalLabel: { flex: 1, textAlign: "right", color: "#888" },
  totalValue: { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold" },
  grandTotal: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  notes: { marginTop: 20, padding: 12, backgroundColor: "#F9FAFB", borderRadius: 4, fontSize: 9, color: "#555" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#AAA", textAlign: "center" },
});

function ClassicTemplate({
  invoice,
  locale,
}: {
  invoice: InvoiceData;
  locale: InvoiceLocale;
}) {
  const groups = groupByCategory(invoice.items);
  const messages = getInvoiceTemplateMessages(locale);
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: classicStyles.page },
      // Header
      React.createElement(
        View,
        { style: classicStyles.header },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: classicStyles.title },
            invoice.senderName || messages.fallbackTitle
          ),
          React.createElement(Text, { style: classicStyles.subtitle }, invoice.displayNumber),
          invoice.title && React.createElement(Text, { style: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 6 } }, invoice.title),
          invoice.subject && React.createElement(Text, { style: { fontSize: 10, color: "#666", marginTop: 2 } }, invoice.subject)
        ),
        React.createElement(
          View,
          { style: { alignItems: "flex-end" } },
          React.createElement(Text, { style: classicStyles.label }, messages.labels.date),
          React.createElement(Text, null, formatInvoiceDate(invoice.issueDate, locale)),
          invoice.dueDate &&
            React.createElement(
              View,
              { style: { marginTop: 6 } },
              React.createElement(Text, { style: classicStyles.label }, messages.labels.due),
              React.createElement(Text, null, formatInvoiceDate(invoice.dueDate, locale))
            )
        )
      ),
      // Sender info
      invoice.senderAddress &&
        React.createElement(
          View,
          { style: classicStyles.senderBlock },
          React.createElement(Text, { style: { fontSize: 9, color: "#666" } }, invoice.senderAddress),
          invoice.senderEmail && React.createElement(Text, { style: { fontSize: 9, color: "#666" } }, invoice.senderEmail),
          invoice.senderPhone && React.createElement(Text, { style: { fontSize: 9, color: "#666" } }, invoice.senderPhone),
          invoice.senderSiret &&
            React.createElement(
              Text,
              { style: { fontSize: 9, color: "#666" } },
              `${messages.labels.siret}: ${invoice.senderSiret}`
            )
        ),
      // Location + Date
      invoice.location &&
        React.createElement(
          Text,
          { style: { fontSize: 9, color: "#666", marginBottom: 10 } },
          `${invoice.location}, ${formatInvoiceDate(invoice.issueDate, locale)}`
        ),
      // Client
      React.createElement(
        View,
        { style: classicStyles.clientBlock },
        React.createElement(Text, { style: classicStyles.label }, messages.labels.billTo),
        React.createElement(Text, { style: { fontFamily: "Helvetica-Bold" } }, invoice.clientName || "—"),
        invoice.clientAddress && React.createElement(Text, { style: { color: "#666" } }, invoice.clientAddress),
        (invoice.clientPostalCode || invoice.clientCity) &&
          React.createElement(Text, { style: { color: "#666" } }, [invoice.clientPostalCode, invoice.clientCity].filter(Boolean).join(" ")),
        invoice.clientCountry && React.createElement(Text, { style: { color: "#666" } }, invoice.clientCountry),
        invoice.clientEmail && React.createElement(Text, { style: { color: "#666" } }, invoice.clientEmail)
      ),
      // Table header
      React.createElement(
        View,
        { style: classicStyles.tableHeader },
        React.createElement(Text, { style: [classicStyles.colDesc, classicStyles.label] }, messages.labels.description),
        React.createElement(Text, { style: [classicStyles.colQty, classicStyles.label] }, messages.labels.quantity),
        React.createElement(Text, { style: [classicStyles.colPrice, classicStyles.label] }, messages.labels.price),
        React.createElement(Text, { style: [classicStyles.colAmount, classicStyles.label] }, messages.labels.amount)
      ),
      // Items
      ...groups.flatMap((g) => [
        g.category
          ? React.createElement(Text, { key: `cat-${g.category}`, style: classicStyles.category }, g.category)
          : null,
        ...g.items.map((item, i) =>
          React.createElement(
            View,
            { key: `${g.category}-${i}`, style: classicStyles.tableRow },
            React.createElement(Text, { style: classicStyles.colDesc }, item.description),
            React.createElement(Text, { style: classicStyles.colQty }, String(item.quantity)),
            React.createElement(Text, { style: classicStyles.colPrice }, fmt(item.unitPrice)),
            React.createElement(Text, { style: classicStyles.colAmount }, fmt(item.amount))
          )
        ),
      ]),
      // Totals
      React.createElement(
        View,
        { style: classicStyles.totalsBlock },
        React.createElement(
          View,
          { style: classicStyles.totalRow },
          React.createElement(Text, { style: classicStyles.totalLabel }, messages.labels.subtotal),
          React.createElement(Text, { style: classicStyles.totalValue }, fmt(invoice.subtotal))
        ),
        (invoice.taxRate ?? 0) > 0 &&
          React.createElement(
            View,
            { style: classicStyles.totalRow },
            React.createElement(
              Text,
              { style: classicStyles.totalLabel },
              `${messages.labels.tax} (${invoice.taxRate}%)`
            ),
            React.createElement(Text, { style: classicStyles.totalValue }, fmt(invoice.taxAmount))
          ),
        React.createElement(
          View,
          { style: [classicStyles.totalRow, { borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 6 }] },
          React.createElement(Text, { style: classicStyles.totalLabel }, messages.labels.total),
          React.createElement(Text, { style: [classicStyles.totalValue, classicStyles.grandTotal] }, fmt(invoice.total))
        )
      ),
      // Notes
      invoice.notes &&
        React.createElement(
          View,
          { style: classicStyles.notes },
          React.createElement(Text, { style: [classicStyles.label, { marginBottom: 4 }] }, messages.labels.notes),
          React.createElement(Text, null, invoice.notes)
        ),
      // Payment terms
      invoice.paymentTerms &&
        React.createElement(
          View,
          { style: { marginTop: 20, fontSize: 8, color: "#888" } },
          React.createElement(Text, null, invoice.paymentTerms)
        ),
      // Banking info
      (invoice.bankName || invoice.iban || invoice.bic) &&
        React.createElement(
          View,
          { style: { marginTop: 20 } },
          invoice.bankName && React.createElement(Text, { style: { fontFamily: "Helvetica-Bold", fontSize: 9 } }, invoice.bankName),
          invoice.iban &&
            React.createElement(
              Text,
              { style: { fontSize: 9 } },
              `${messages.labels.iban}: ${invoice.iban}`
            ),
          invoice.bic &&
            React.createElement(
              Text,
              { style: { fontSize: 9 } },
              `${messages.labels.bicSwift}: ${invoice.bic}`
            )
        ),
      // Footer
      invoice.senderVatMention &&
        React.createElement(Text, { style: classicStyles.footer }, invoice.senderVatMention)
    )
  );
}

// ─── Modern Template ───

const modernStyles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", color: "#1D1B16" },
  banner: { backgroundColor: "#0F766E", padding: 30, paddingBottom: 20, color: "#fff" },
  bannerTitle: { fontSize: 24, fontWeight: "bold", fontFamily: "Helvetica-Bold", color: "#fff" },
  bannerSub: { fontSize: 10, color: "#A7F3D0", marginTop: 4 },
  body: { padding: 30 },
  infoRow: { flexDirection: "row", gap: 20, marginBottom: 20 },
  infoCard: { flex: 1, padding: 12, backgroundColor: "#F0FDFA", borderRadius: 6 },
  label: { fontSize: 8, color: "#888", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#0F766E", borderRadius: 4, padding: 8, marginBottom: 4 },
  thText: { color: "#fff", fontSize: 8, textTransform: "uppercase", letterSpacing: 1 },
  rowEven: { flexDirection: "row", padding: 8, backgroundColor: "#F9FAFB", borderRadius: 2, marginBottom: 2 },
  rowOdd: { flexDirection: "row", padding: 8, marginBottom: 2 },
  colDesc: { flex: 3 },
  colQty: { flex: 0.8, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colAmount: { flex: 1, textAlign: "right" },
  category: { fontSize: 9, fontWeight: "bold", fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 4, color: "#0F766E" },
  totalsBlock: { marginTop: 16, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 30, paddingVertical: 3, width: 200 },
  totalLabel: { flex: 1, textAlign: "right", color: "#888" },
  totalValue: { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold" },
  notes: { marginTop: 20, padding: 12, backgroundColor: "#F0FDFA", borderRadius: 6, fontSize: 9, color: "#555" },
  footer: { position: "absolute", bottom: 30, left: 30, right: 30, fontSize: 8, color: "#AAA", textAlign: "center" },
});

function ModernTemplate({
  invoice,
  locale,
}: {
  invoice: InvoiceData;
  locale: InvoiceLocale;
}) {
  const groups = groupByCategory(invoice.items);
  const messages = getInvoiceTemplateMessages(locale);
  let rowIndex = 0;
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: { fontFamily: "Helvetica" } },
      // Banner
      React.createElement(
        View,
        { style: modernStyles.banner },
        React.createElement(
          Text,
          { style: modernStyles.bannerTitle },
          invoice.senderName || messages.fallbackTitle
        ),
        React.createElement(Text, { style: modernStyles.bannerSub }, invoice.displayNumber),
        invoice.title && React.createElement(Text, { style: { fontSize: 14, color: "#fff", fontFamily: "Helvetica-Bold", marginTop: 6 } }, invoice.title),
        invoice.subject && React.createElement(Text, { style: { fontSize: 10, color: "#A7F3D0", marginTop: 2 } }, invoice.subject)
      ),
      React.createElement(
        View,
        { style: modernStyles.body },
        // Info cards
        React.createElement(
          View,
          { style: modernStyles.infoRow },
          React.createElement(
            View,
            { style: modernStyles.infoCard },
            React.createElement(Text, { style: modernStyles.label }, messages.labels.from),
            React.createElement(Text, { style: { fontFamily: "Helvetica-Bold" } }, invoice.senderName || "—"),
            invoice.senderEmail && React.createElement(Text, { style: { color: "#666", marginTop: 2 } }, invoice.senderEmail)
          ),
          React.createElement(
            View,
            { style: modernStyles.infoCard },
            React.createElement(Text, { style: modernStyles.label }, messages.labels.billTo),
            React.createElement(Text, { style: { fontFamily: "Helvetica-Bold" } }, invoice.clientName || "—"),
            invoice.clientAddress && React.createElement(Text, { style: { color: "#666", marginTop: 2 } }, invoice.clientAddress),
            (invoice.clientPostalCode || invoice.clientCity) &&
              React.createElement(Text, { style: { color: "#666", marginTop: 1 } }, [invoice.clientPostalCode, invoice.clientCity].filter(Boolean).join(" ")),
            invoice.clientCountry && React.createElement(Text, { style: { color: "#666", marginTop: 1 } }, invoice.clientCountry),
            invoice.clientEmail && React.createElement(Text, { style: { color: "#666", marginTop: 2 } }, invoice.clientEmail)
          ),
          React.createElement(
            View,
            { style: modernStyles.infoCard },
            React.createElement(
              Text,
              { style: modernStyles.label },
              invoice.location ? messages.labels.locationAndDate : messages.labels.date
            ),
            invoice.location && React.createElement(Text, null, invoice.location),
            React.createElement(
              Text,
              { style: invoice.location ? { color: "#666", marginTop: 2 } : undefined },
              formatInvoiceDate(invoice.issueDate, locale)
            ),
            invoice.dueDate &&
              React.createElement(
                Text,
                { style: { color: "#666", marginTop: 2 } },
                `${messages.labels.due}: ${formatInvoiceDate(invoice.dueDate, locale)}`
              )
          )
        ),
        // Table header
        React.createElement(
          View,
          { style: modernStyles.tableHeader },
          React.createElement(Text, { style: [modernStyles.colDesc, modernStyles.thText] }, messages.labels.description),
          React.createElement(Text, { style: [modernStyles.colQty, modernStyles.thText] }, messages.labels.quantity),
          React.createElement(Text, { style: [modernStyles.colPrice, modernStyles.thText] }, messages.labels.price),
          React.createElement(Text, { style: [modernStyles.colAmount, modernStyles.thText] }, messages.labels.amount)
        ),
        // Items
        ...groups.flatMap((g) => [
          g.category
            ? React.createElement(Text, { key: `cat-${g.category}`, style: modernStyles.category }, g.category)
            : null,
          ...g.items.map((item, i) => {
            const isEven = rowIndex++ % 2 === 0;
            return React.createElement(
              View,
              { key: `${g.category}-${i}`, style: isEven ? modernStyles.rowEven : modernStyles.rowOdd },
              React.createElement(Text, { style: modernStyles.colDesc }, item.description),
              React.createElement(Text, { style: modernStyles.colQty }, String(item.quantity)),
              React.createElement(Text, { style: modernStyles.colPrice }, fmt(item.unitPrice)),
              React.createElement(Text, { style: modernStyles.colAmount }, fmt(item.amount))
            );
          }),
        ]),
        // Totals
        React.createElement(
          View,
          { style: modernStyles.totalsBlock },
          React.createElement(
            View,
            { style: modernStyles.totalRow },
            React.createElement(Text, { style: modernStyles.totalLabel }, messages.labels.subtotal),
            React.createElement(Text, { style: modernStyles.totalValue }, fmt(invoice.subtotal))
          ),
          (invoice.taxRate ?? 0) > 0 &&
            React.createElement(
              View,
              { style: modernStyles.totalRow },
              React.createElement(
                Text,
                { style: modernStyles.totalLabel },
                `${messages.labels.tax} (${invoice.taxRate}%)`
              ),
              React.createElement(Text, { style: modernStyles.totalValue }, fmt(invoice.taxAmount))
            ),
          React.createElement(
            View,
            { style: [modernStyles.totalRow, { borderTopWidth: 1, borderTopColor: "#0F766E", paddingTop: 6 }] },
            React.createElement(Text, { style: modernStyles.totalLabel }, messages.labels.total),
            React.createElement(Text, { style: [modernStyles.totalValue, { fontSize: 14 }] }, fmt(invoice.total))
          )
        ),
        // Notes
        invoice.notes &&
          React.createElement(
            View,
            { style: modernStyles.notes },
            React.createElement(Text, null, invoice.notes)
          ),
        invoice.paymentTerms &&
          React.createElement(
            View,
            { style: { marginTop: 16, fontSize: 8, color: "#888" } },
            React.createElement(Text, null, invoice.paymentTerms)
          ),
        (invoice.bankName || invoice.iban || invoice.bic) &&
          React.createElement(
            View,
            { style: { marginTop: 16 } },
            invoice.bankName && React.createElement(Text, { style: { fontFamily: "Helvetica-Bold", fontSize: 9 } }, invoice.bankName),
            invoice.iban &&
              React.createElement(
                Text,
                { style: { fontSize: 9 } },
                `${messages.labels.iban}: ${invoice.iban}`
              ),
            invoice.bic &&
              React.createElement(
                Text,
                { style: { fontSize: 9 } },
                `${messages.labels.bicSwift}: ${invoice.bic}`
              )
          )
      ),
      invoice.senderVatMention &&
        React.createElement(Text, { style: modernStyles.footer }, invoice.senderVatMention)
    )
  );
}

// ─── Minimal Template ───

const minimalStyles = StyleSheet.create({
  page: { padding: 50, fontSize: 10, fontFamily: "Helvetica", color: "#1D1B16" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 40 },
  title: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#888" },
  invoiceNum: { fontSize: 18, fontFamily: "Helvetica-Bold", marginTop: 2 },
  clientBlock: { marginBottom: 30 },
  label: { fontSize: 8, color: "#AAA", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#E5E7EB", marginVertical: 6 },
  row: { flexDirection: "row", paddingVertical: 6 },
  colDesc: { flex: 3 },
  colRight: { flex: 1, textAlign: "right", color: "#888" },
  colAmount: { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold" },
  category: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 4, color: "#888" },
  totalsBlock: { marginTop: 20, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 30, paddingVertical: 3, width: 180 },
  totalLabel: { flex: 1, textAlign: "right", color: "#AAA" },
  totalValue: { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold" },
  notes: { marginTop: 30, padding: 16, backgroundColor: "#FAFAFA", borderRadius: 4, fontSize: 9, color: "#888" },
  footer: { position: "absolute", bottom: 40, left: 50, right: 50, fontSize: 8, color: "#CCC", textAlign: "center" },
});

function MinimalTemplate({
  invoice,
  locale,
}: {
  invoice: InvoiceData;
  locale: InvoiceLocale;
}) {
  const groups = groupByCategory(invoice.items);
  const messages = getInvoiceTemplateMessages(locale);
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: minimalStyles.page },
      React.createElement(
        View,
        { style: minimalStyles.header },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: minimalStyles.title },
            invoice.senderName || messages.fallbackTitle
          ),
          React.createElement(Text, { style: minimalStyles.invoiceNum }, invoice.displayNumber),
          invoice.title && React.createElement(Text, { style: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 4 } }, invoice.title),
          invoice.subject && React.createElement(Text, { style: { fontSize: 9, color: "#888", marginTop: 2 } }, invoice.subject)
        ),
        React.createElement(
          View,
          { style: { alignItems: "flex-end" } },
          React.createElement(Text, { style: { color: "#AAA" } }, formatInvoiceDate(invoice.issueDate, locale)),
          invoice.dueDate &&
            React.createElement(
              Text,
              { style: { color: "#CCC", marginTop: 2 } },
              `${messages.labels.due} ${formatInvoiceDate(invoice.dueDate, locale)}`
            )
        )
      ),
      invoice.location &&
        React.createElement(
          Text,
          { style: { fontSize: 9, color: "#AAA", marginBottom: 10 } },
          `${invoice.location}, ${formatInvoiceDate(invoice.issueDate, locale)}`
        ),
      React.createElement(
        View,
        { style: minimalStyles.clientBlock },
        React.createElement(Text, { style: minimalStyles.label }, messages.labels.to),
        React.createElement(Text, null, invoice.clientName || "—"),
        invoice.clientAddress && React.createElement(Text, { style: { color: "#888" } }, invoice.clientAddress),
        (invoice.clientPostalCode || invoice.clientCity) &&
          React.createElement(Text, { style: { color: "#888" } }, [invoice.clientPostalCode, invoice.clientCity].filter(Boolean).join(" ")),
        invoice.clientCountry && React.createElement(Text, { style: { color: "#888" } }, invoice.clientCountry),
        invoice.clientEmail && React.createElement(Text, { style: { color: "#888" } }, invoice.clientEmail)
      ),
      React.createElement(View, { style: minimalStyles.divider }),
      ...groups.flatMap((g) => [
        g.category
          ? React.createElement(Text, { key: `cat-${g.category}`, style: minimalStyles.category }, g.category)
          : null,
        ...g.items.map((item, i) =>
          React.createElement(
            View,
            { key: `${g.category}-${i}` },
            React.createElement(
              View,
              { style: minimalStyles.row },
              React.createElement(Text, { style: minimalStyles.colDesc }, item.description),
              React.createElement(Text, { style: minimalStyles.colRight }, `${item.quantity} x ${fmt(item.unitPrice)}`),
              React.createElement(Text, { style: minimalStyles.colAmount }, fmt(item.amount))
            ),
            React.createElement(View, { style: minimalStyles.divider })
          )
        ),
      ]),
        React.createElement(
          View,
          { style: minimalStyles.totalsBlock },
          React.createElement(
            View,
            { style: minimalStyles.totalRow },
            React.createElement(Text, { style: minimalStyles.totalLabel }, messages.labels.subtotal),
            React.createElement(Text, { style: minimalStyles.totalValue }, fmt(invoice.subtotal))
          ),
          (invoice.taxRate ?? 0) > 0 &&
            React.createElement(
              View,
              { style: minimalStyles.totalRow },
              React.createElement(
                Text,
                { style: minimalStyles.totalLabel },
                `${messages.labels.tax} ${invoice.taxRate}%`
              ),
              React.createElement(Text, { style: minimalStyles.totalValue }, fmt(invoice.taxAmount))
            ),
          React.createElement(
            View,
            { style: [minimalStyles.totalRow, { marginTop: 4 }] },
            React.createElement(Text, { style: [minimalStyles.totalLabel, { fontSize: 12 }] }, messages.labels.total),
            React.createElement(Text, { style: [minimalStyles.totalValue, { fontSize: 14 }] }, fmt(invoice.total))
          )
        ),
      invoice.notes &&
        React.createElement(
          View,
          { style: minimalStyles.notes },
          React.createElement(Text, null, invoice.notes)
        ),
      invoice.paymentTerms &&
        React.createElement(
          View,
          { style: { marginTop: 20, fontSize: 8, color: "#AAA" } },
          React.createElement(Text, null, invoice.paymentTerms)
        ),
        (invoice.bankName || invoice.iban || invoice.bic) &&
          React.createElement(
            View,
            { style: { marginTop: 20 } },
            invoice.bankName && React.createElement(Text, { style: { fontFamily: "Helvetica-Bold", fontSize: 9 } }, invoice.bankName),
            invoice.iban &&
              React.createElement(
                Text,
                { style: { fontSize: 9, color: "#888" } },
                `${messages.labels.iban}: ${invoice.iban}`
              ),
            invoice.bic &&
              React.createElement(
                Text,
                { style: { fontSize: 9, color: "#888" } },
                `${messages.labels.bicSwift}: ${invoice.bic}`
              )
          ),
      invoice.senderVatMention &&
        React.createElement(Text, { style: minimalStyles.footer }, invoice.senderVatMention)
    )
  );
}

// ─── Helpers ───

function groupByCategory(items: InvoiceData["items"]) {
  const groups: { category: string; items: InvoiceData["items"] }[] = [];
  for (const item of items) {
    const cat = item.category || "";
    const existing = groups.find((g) => g.category === cat);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ category: cat, items: [item] });
    }
  }
  return groups;
}

// ─── Public API ───

export async function generateInvoicePdf(
  invoice: InvoiceData,
  locale?: string | null
): Promise<Buffer> {
  const templateType = invoice.templateType || "CLASSIC";
  const normalizedLocale = normalizeInvoiceLocale(locale);
  let component: React.ReactElement;

  switch (templateType) {
    case "MODERN":
      component = React.createElement(ModernTemplate, {
        invoice,
        locale: normalizedLocale,
      });
      break;
    case "MINIMAL":
      component = React.createElement(MinimalTemplate, {
        invoice,
        locale: normalizedLocale,
      });
      break;
    default:
      component = React.createElement(ClassicTemplate, {
        invoice,
        locale: normalizedLocale,
      });
  }

  return renderToBuffer(
    component as React.ReactElement<React.ComponentProps<typeof Document>>
  );
}
