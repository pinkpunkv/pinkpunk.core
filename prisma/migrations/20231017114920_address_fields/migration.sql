/*
  Warnings:

  - You are about to drop the column `apartments` on the `AddressFields` table. All the data in the column will be lost.
  - You are about to drop the column `streetNumber` on the `AddressFields` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AddressFields" DROP COLUMN "apartments",
DROP COLUMN "streetNumber",
ADD COLUMN     "apartment" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "building" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "comment" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "street" TEXT NOT NULL DEFAULT '';
