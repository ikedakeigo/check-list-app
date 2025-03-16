/*
  Warnings:

  - Made the column `checkListId` on table `Notification` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_checkListId_fkey";

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "checkListId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_checkListId_fkey" FOREIGN KEY ("checkListId") REFERENCES "CheckLists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
