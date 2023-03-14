/*
  Warnings:

  - You are about to drop the column `addressName` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `Address` table. All the data in the column will be lost.
  - Added the required column `mask` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "addressName",
DROP COLUMN "postalCode",
ADD COLUMN     "mask" TEXT NOT NULL;
