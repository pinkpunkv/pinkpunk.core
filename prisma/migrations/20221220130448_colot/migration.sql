/*
  Warnings:

  - You are about to drop the column `colot` on the `VariantTemplate` table. All the data in the column will be lost.
  - Added the required column `color` to the `VariantTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VariantTemplate" DROP COLUMN "colot",
ADD COLUMN     "color" TEXT NOT NULL;
