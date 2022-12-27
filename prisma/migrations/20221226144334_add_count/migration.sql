/*
  Warnings:

  - You are about to drop the column `isBought` on the `Variant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Variant" DROP COLUMN "isBought",
ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 0;
