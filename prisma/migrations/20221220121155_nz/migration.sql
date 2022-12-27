/*
  Warnings:

  - You are about to drop the column `collctionId` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_collctionId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "collctionId",
ADD COLUMN     "collectionId" INTEGER;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
