import Stripe from "stripe";

import { stripe } from "@/server/stripe";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const EMAIL_SENT_METADATA_KEY = "kronoma_invoice_email_sent_at";

type PaidStripeInvoiceEmailParams = {
  invoice: Stripe.Invoice;
  fallbackEmail?: string | null;
  fallbackName?: string | null;
};

const BRAND = {
  name: "Kronoma",
  accent: "#f97316",
  accentAlt: "#0f766e",
  text: "#171717",
  muted: "#6b7280",
  border: "#e5e7eb",
  surface: "#fff7ed",
  background: "#f7f1e5",
  card: "#ffffff",
} as const;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatStripeAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function buildPaidInvoiceEmail(params: {
  customerName: string | null;
  invoiceNumber: string;
  amount: string;
  hostedInvoiceUrl: string | null;
}) {
  const greeting = params.customerName
    ? `Bonjour ${params.customerName},`
    : "Bonjour,";
  const title = "Votre facture Kronoma";
  const intro =
    "Merci pour votre paiement. Votre facture est jointe à cet email au format PDF.";
  const hostedInvoiceCopy = params.hostedInvoiceUrl
    ? "Vous pouvez aussi consulter la facture en ligne depuis ce lien :"
    : null;
  const subject = `Votre facture Kronoma ${params.invoiceNumber}`;

  const safeGreeting = escapeHtml(greeting);
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeInvoiceNumber = escapeHtml(params.invoiceNumber);
  const safeAmount = escapeHtml(params.amount);
  const safeHostedInvoiceUrl = params.hostedInvoiceUrl
    ? escapeHtml(params.hostedInvoiceUrl)
    : null;

  const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.background};font-family:Inter,Arial,sans-serif;color:${BRAND.text};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Votre facture Kronoma est disponible en pièce jointe.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:${BRAND.background};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border-collapse:collapse;">
            <tr>
              <td style="padding-bottom:16px;text-align:left;font-size:28px;font-weight:700;color:${BRAND.text};">
                ${BRAND.name}
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:24px;padding:0;overflow:hidden;box-shadow:0 24px 80px rgba(15,23,42,0.08);">
                <div style="padding:32px;background:linear-gradient(135deg, ${BRAND.surface} 0%, #ffffff 72%);border-bottom:1px solid ${BRAND.border};">
                  <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(15,118,110,0.10);color:${BRAND.accentAlt};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
                    Paiement confirmé
                  </div>
                  <h1 style="margin:18px 0 12px;font-size:32px;line-height:1.15;color:${BRAND.text};">
                    ${safeTitle}
                  </h1>
                  <p style="margin:0;font-size:16px;line-height:1.7;color:${BRAND.muted};">
                    ${safeGreeting}
                  </p>
                </div>

                <div style="padding:32px;">
                  <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:${BRAND.muted};">
                    ${safeIntro}
                  </p>

                  <div style="margin-bottom:24px;padding:16px;border:1px solid ${BRAND.border};border-radius:16px;background:#fafafa;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.muted};margin-bottom:8px;">
                      Facture
                    </div>
                    <div style="font-size:15px;font-weight:700;color:${BRAND.text};word-break:break-word;">
                      ${safeInvoiceNumber}
                    </div>
                    <div style="margin-top:8px;font-size:15px;color:${BRAND.muted};">
                      Montant payé : <strong style="color:${BRAND.text};">${safeAmount}</strong>
                    </div>
                  </div>

                  ${
                    safeHostedInvoiceUrl && hostedInvoiceCopy
                      ? `<div style="margin-bottom:24px;padding:16px;border-radius:16px;background:${BRAND.surface};border:1px solid #fed7aa;">
                    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:${BRAND.text};">
                      ${escapeHtml(hostedInvoiceCopy)}
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.7;word-break:break-all;color:${BRAND.accentAlt};">
                      <a href="${safeHostedInvoiceUrl}" style="color:${BRAND.accentAlt};text-decoration:none;">${safeHostedInvoiceUrl}</a>
                    </p>
                  </div>`
                      : ""
                  }

                  <p style="margin:0;font-size:14px;line-height:1.7;color:${BRAND.text};">
                    Merci,<br />L'équipe Kronoma
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    greeting,
    "",
    intro,
    "",
    `Facture: ${params.invoiceNumber}`,
    `Montant payé: ${params.amount}`,
    ...(params.hostedInvoiceUrl
      ? ["", "Facture en ligne:", params.hostedInvoiceUrl]
      : []),
    "",
    "Merci,",
    "L'équipe Kronoma",
  ].join("\n");

  return { subject, html, text };
}

async function fetchInvoicePdfBase64(invoicePdfUrl: string) {
  const response = await fetch(invoicePdfUrl);

  if (!response.ok) {
    throw new Error(`Stripe invoice PDF download failed: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer()).toString("base64");
}

export async function sendPaidStripeInvoiceEmail({
  invoice,
  fallbackEmail,
  fallbackName,
}: PaidStripeInvoiceEmailParams) {
  const apiKey = process.env.BILLING_RESEND_KEY ?? process.env.AUTH_RESEND_KEY;
  const from = process.env.BILLING_RESEND_FROM ?? process.env.AUTH_RESEND_FROM;

  if (!apiKey || !from) {
    console.warn("Billing invoice email skipped - Resend is not configured.");
    return;
  }

  if (invoice.amount_paid <= 0) {
    console.log("Billing invoice email skipped - invoice amount is zero.");
    return;
  }

  if (invoice.metadata?.[EMAIL_SENT_METADATA_KEY]) {
    console.log("Billing invoice email skipped - already sent.");
    return;
  }

  const to = invoice.customer_email ?? fallbackEmail;
  if (!to) {
    console.warn("Billing invoice email skipped - no customer email.");
    return;
  }

  if (!invoice.invoice_pdf) {
    console.warn("Billing invoice email skipped - missing Stripe invoice PDF URL.");
    return;
  }

  const invoiceNumber = invoice.number ?? invoice.id;
  const content = buildPaidInvoiceEmail({
    customerName: invoice.customer_name ?? fallbackName ?? null,
    invoiceNumber,
    amount: formatStripeAmount(invoice.amount_paid, invoice.currency),
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
  });
  const pdfBase64 = await fetchInvoicePdfBase64(invoice.invoice_pdf);

  const response = await fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdfBase64,
          content_type: "application/pdf",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend invoice email error: ${JSON.stringify(await response.json())}`);
  }

  try {
    await stripe.invoices.update(invoice.id, {
      metadata: {
        [EMAIL_SENT_METADATA_KEY]: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.warn("Billing invoice email sent, but metadata update failed:", error);
  }

  console.log("Billing invoice email sent for", invoice.id);
}
