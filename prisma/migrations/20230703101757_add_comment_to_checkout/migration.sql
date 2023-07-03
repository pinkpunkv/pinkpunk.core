/*
  Warnings:

  - Made the column `colorId` on table `Variant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `size` on table `Variant` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Variant" DROP CONSTRAINT "Variant_colorId_fkey";

-- DropForeignKey
ALTER TABLE "Variant" DROP CONSTRAINT "Variant_size_fkey";

-- AlterTable
ALTER TABLE "CheckoutInfo" ADD COLUMN     "comment" TEXT;

-- AlterTable
ALTER TABLE "Variant" ALTER COLUMN "colorId" SET NOT NULL,
ALTER COLUMN "size" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_size_fkey" FOREIGN KEY ("size") REFERENCES "Size"("size") ON DELETE RESTRICT ON UPDATE CASCADE;
