/*
  Warnings:

  - You are about to drop the column `color` on the `ProductsImages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductsImages" DROP COLUMN "color";

-- CreateTable
CREATE TABLE "_ImageToVariant" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToVariant_AB_unique" ON "_ImageToVariant"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToVariant_B_index" ON "_ImageToVariant"("B");

-- AddForeignKey
ALTER TABLE "_ImageToVariant" ADD CONSTRAINT "_ImageToVariant_A_fkey" FOREIGN KEY ("A") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImageToVariant" ADD CONSTRAINT "_ImageToVariant_B_fkey" FOREIGN KEY ("B") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
