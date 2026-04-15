-- AlterTable
ALTER TABLE "ExpenseReceipt"
ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT,
ADD COLUMN IF NOT EXISTS "amount" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "billedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Backfill invoice dates for existing records
UPDATE "ExpenseReceipt"
SET "billedAt" = "createdAt"
WHERE "billedAt" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExpenseReceipt_expenseId_billedAt_idx" ON "ExpenseReceipt"("expenseId", "billedAt");
