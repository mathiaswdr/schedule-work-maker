-- AddColumn
ALTER TABLE "BlogPost" ADD COLUMN "translationKey" TEXT;

-- Backfill existing posts so each current article becomes its own translation group.
UPDATE "BlogPost"
SET "translationKey" = "slug"
WHERE "translationKey" IS NULL;

-- AlterColumn
ALTER TABLE "BlogPost" ALTER COLUMN "translationKey" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_locale_translationKey_key" ON "BlogPost"("locale", "translationKey");

-- CreateIndex
CREATE INDEX "BlogPost_translationKey_idx" ON "BlogPost"("translationKey");
