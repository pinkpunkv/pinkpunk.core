/*
  Warnings:

  - You are about to drop the column `wans` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "wans",
ADD COLUMN     "wants" DECIMAL(65,30) NOT NULL DEFAULT 0;
