/*
  Warnings:

  - Added the required column `number` to the `ProductsImages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductsImages" ADD COLUMN     "number" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "VariantTemplate" (
    "id" SERIAL NOT NULL,
    "size" TEXT NOT NULL,
    "colot" TEXT NOT NULL,

    CONSTRAINT "VariantTemplate_pkey" PRIMARY KEY ("id")
);
