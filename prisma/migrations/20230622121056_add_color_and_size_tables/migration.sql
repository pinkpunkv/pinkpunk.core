/*
  Warnings:

  - You are about to drop the column `color` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `colorText` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Variant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Variant" DROP COLUMN "color",
DROP COLUMN "colorText",
DROP COLUMN "size",
ADD COLUMN     "colorId" INTEGER,
ADD COLUMN     "sizes" TEXT;

-- CreateTable
CREATE TABLE "Color" (
    "id" SERIAL NOT NULL,
    "color" TEXT NOT NULL,
    "colorText" TEXT,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Size" (
    "size" TEXT NOT NULL,

    CONSTRAINT "Size_pkey" PRIMARY KEY ("size")
);

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_sizes_fkey" FOREIGN KEY ("sizes") REFERENCES "Size"("size") ON DELETE SET NULL ON UPDATE CASCADE;
