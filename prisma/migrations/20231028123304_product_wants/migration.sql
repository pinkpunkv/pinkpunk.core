/*
  Warnings:

  - You are about to drop the column `wants` on the `Product` table. All the data in the column will be lost.
  - Added the required column `productId` to the `Want` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "wants";

-- AlterTable
ALTER TABLE "Want" ADD COLUMN     "productId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Want" ADD CONSTRAINT "Want_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
