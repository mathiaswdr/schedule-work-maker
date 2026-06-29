-- CreateTable
CREATE TABLE "AccountDeletionFeedback" (
    "id" TEXT NOT NULL,
    "userIdHash" TEXT NOT NULL,
    "emailHash" TEXT,
    "plan" "UserPlan" NOT NULL,
    "reasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "customReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountDeletionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountDeletionFeedback_createdAt_idx" ON "AccountDeletionFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "AccountDeletionFeedback_plan_idx" ON "AccountDeletionFeedback"("plan");

-- Supabase public schemas should keep RLS enabled, even for server-only tables.
ALTER TABLE "AccountDeletionFeedback" ENABLE ROW LEVEL SECURITY;
