/*
  Warnings:

  - You are about to drop the `CheckListItems` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CheckListItems" DROP CONSTRAINT "CheckListItems_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CheckListItems" DROP CONSTRAINT "CheckListItems_checkListId_fkey";

-- DropForeignKey
ALTER TABLE "CheckListItems" DROP CONSTRAINT "CheckListItems_userId_fkey";

-- DropTable
DROP TABLE "CheckListItems";

-- CreateTable
CREATE TABLE "CheckListItem" (
    "id" SERIAL NOT NULL,
    "checkListId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "quantity" INTEGER,
    "status" "Status" NOT NULL DEFAULT 'Pending',
    "completedAt" TIMESTAMP(3),
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckListItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CheckListItem" ADD CONSTRAINT "CheckListItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckListItem" ADD CONSTRAINT "CheckListItem_checkListId_fkey" FOREIGN KEY ("checkListId") REFERENCES "CheckLists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckListItem" ADD CONSTRAINT "CheckListItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
