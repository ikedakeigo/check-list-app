/*
  Warnings:

  - Made the column `userId` on table `CheckListItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `CheckLists` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "CheckListItem" DROP CONSTRAINT "CheckListItem_userId_fkey";

-- DropForeignKey
ALTER TABLE "CheckLists" DROP CONSTRAINT "CheckLists_userId_fkey";

-- AlterTable
ALTER TABLE "CheckListItem" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CheckLists" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "CheckLists" ADD CONSTRAINT "CheckLists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckListItem" ADD CONSTRAINT "CheckListItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
