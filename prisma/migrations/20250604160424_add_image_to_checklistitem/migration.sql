/*
  Warnings:

  - You are about to drop the `CheckListItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CheckListItem" DROP CONSTRAINT "CheckListItem_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CheckListItem" DROP CONSTRAINT "CheckListItem_checkListId_fkey";

-- DropForeignKey
ALTER TABLE "CheckListItem" DROP CONSTRAINT "CheckListItem_userId_fkey";

-- DropTable
DROP TABLE "CheckListItem";

-- CreateTable
CREATE TABLE "checkListItems" (
    "id" SERIAL NOT NULL,
    "checkListId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "quantity" INTEGER,
    "status" "Status" NOT NULL DEFAULT 'NotStarted',
    "completedAt" TIMESTAMP(3),
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageKey" TEXT,
    "uploadedAt" TIMESTAMP(3),

    CONSTRAINT "checkListItems_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "checkListItems" ADD CONSTRAINT "checkListItems_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkListItems" ADD CONSTRAINT "checkListItems_checkListId_fkey" FOREIGN KEY ("checkListId") REFERENCES "CheckLists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkListItems" ADD CONSTRAINT "checkListItems_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
