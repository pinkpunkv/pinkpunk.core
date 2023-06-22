/*
  Warnings:

  - You are about to drop the column `sizes` on the `Variant` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Variant" DROP CONSTRAINT "Variant_sizes_fkey";

-- AlterTable
ALTER TABLE "Variant" DROP COLUMN "sizes",
ADD COLUMN     "size" TEXT;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_size_fkey" FOREIGN KEY ("size") REFERENCES "Size"("size") ON DELETE SET NULL ON UPDATE CASCADE;
