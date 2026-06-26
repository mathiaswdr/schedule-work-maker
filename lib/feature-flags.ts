export function isEmailInvoiceImportEnabled() {
  return (
    process.env.EMAIL_INVOICE_IMPORT_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_EMAIL_INVOICE_IMPORT_ENABLED === "true"
  );
}
