/*
  Warnings:

  - You are about to drop the column `userId` on the `CheckListItem` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `CheckLists` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Notification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CheckListItem" DROP CONSTRAINT "CheckListItem_userId_fkey";

-- DropForeignKey
ALTER TABLE "CheckLists" DROP CONSTRAINT "CheckLists_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- AlterTable
ALTER TABLE "CheckListItem" DROP COLUMN "userId",
ADD COLUMN     "supabaseUserId" TEXT;

-- AlterTable
ALTER TABLE "CheckLists" DROP COLUMN "userId",
ADD COLUMN     "supabaseUserId" TEXT;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "userId",
ADD COLUMN     "supabaseUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_supabaseUserId_fkey" FOREIGN KEY ("supabaseUserId") REFERENCES "User"("supabaseUserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckLists" ADD CONSTRAINT "CheckLists_supabaseUserId_fkey" FOREIGN KEY ("supabaseUserId") REFERENCES "User"("supabaseUserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckListItem" ADD CONSTRAINT "CheckListItem_supabaseUserId_fkey" FOREIGN KEY ("supabaseUserId") REFERENCES "User"("supabaseUserId") ON DELETE SET NULL ON UPDATE CASCADE;
