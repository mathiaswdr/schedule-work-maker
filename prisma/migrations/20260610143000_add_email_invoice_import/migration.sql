-- CreateEnum
CREATE TYPE "EmailProvider" AS ENUM ('GMAIL', 'OUTLOOK');

-- CreateEnum
CREATE TYPE "DetectedInvoiceStatus" AS ENUM ('PENDING', 'IMPORTED', 'IGNORED');

-- CreateTable
CREATE TABLE "EmailConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "EmailProvider" NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectedInvoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailConnectionId" TEXT NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "sender" TEXT,
    "subject" TEXT,
    "receivedAt" TIMESTAMP(3),
    "attachmentFileName" TEXT NOT NULL,
    "attachmentMimeType" TEXT,
    "attachmentStorageUrl" TEXT,
    "storageKey" TEXT,
    "extractedText" TEXT,
    "vendorName" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "currency" TEXT,
    "subtotalAmount" DOUBLE PRECISION,
    "taxAmount" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "DetectedInvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "createdExpenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetectedInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailConnection_userId_provider_email_key" ON "EmailConnection"("userId", "provider", "email");

-- CreateIndex
CREATE INDEX "EmailConnection_userId_provider_idx" ON "EmailConnection"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "DetectedInvoice_emailConnectionId_providerMessageId_attachmentFileName_key" ON "DetectedInvoice"("emailConnectionId", "providerMessageId", "attachmentFileName");

-- CreateIndex
CREATE INDEX "DetectedInvoice_userId_status_idx" ON "DetectedInvoice"("userId", "status");

-- CreateIndex
CREATE INDEX "DetectedInvoice_emailConnectionId_idx" ON "DetectedInvoice"("emailConnectionId");

-- CreateIndex
CREATE INDEX "DetectedInvoice_createdExpenseId_idx" ON "DetectedInvoice"("createdExpenseId");

-- AddForeignKey
ALTER TABLE "EmailConnection" ADD CONSTRAINT "EmailConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedInvoice" ADD CONSTRAINT "DetectedInvoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedInvoice" ADD CONSTRAINT "DetectedInvoice_emailConnectionId_fkey" FOREIGN KEY ("emailConnectionId") REFERENCES "EmailConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedInvoice" ADD CONSTRAINT "DetectedInvoice_createdExpenseId_fkey" FOREIGN KEY ("createdExpenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
