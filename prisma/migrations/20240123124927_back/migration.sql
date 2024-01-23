/*
  Warnings:

  - You are about to drop the column `apartment` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `building` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `Address` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "apartment",
DROP COLUMN "building",
DROP COLUMN "city",
DROP COLUMN "comment",
DROP COLUMN "company",
DROP COLUMN "country",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "street",
DROP COLUMN "type",
DROP COLUMN "zipCode",
ALTER COLUMN "mask" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "AddressFields" ADD CONSTRAINT "AddressFields_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE CASCADE ON UPDATE CASCADE;
