/*
  Warnings:

  - You are about to drop the column `supabaseUserId` on the `CheckListItem` table. All the data in the column will be lost.
  - You are about to drop the column `supabaseUserId` on the `CheckLists` table. All the data in the column will be lost.
  - You are about to drop the column `supabaseUserId` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CheckListItem" DROP CONSTRAINT "CheckListItem_supabaseUserId_fkey";

-- DropForeignKey
ALTER TABLE "CheckLists" DROP CONSTRAINT "CheckLists_supabaseUserId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_supabaseUserId_fkey";

-- AlterTable
ALTER TABLE "CheckListItem" DROP COLUMN "supabaseUserId",
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "CheckLists" DROP COLUMN "supabaseUserId",
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "supabaseUserId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckLists" ADD CONSTRAINT "CheckLists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckListItem" ADD CONSTRAINT "CheckListItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
