/*
  Warnings:

  - A unique constraint covering the columns `[size,color]` on the table `Variant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Variant_size_color_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Variant_size_color_key" ON "Variant"("size", "color");
