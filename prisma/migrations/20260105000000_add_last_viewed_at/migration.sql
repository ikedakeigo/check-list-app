-- AlterTable
ALTER TABLE "CheckLists" ADD COLUMN IF NOT EXISTS "lastViewedAt" TIMESTAMP(3);
