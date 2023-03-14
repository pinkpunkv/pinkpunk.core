/*
  Warnings:

  - The primary key for the `Address` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "AddressFields" DROP CONSTRAINT "AddressFields_addressId_fkey";

-- DropForeignKey
ALTER TABLE "Checkout" DROP CONSTRAINT "Checkout_addressId_fkey";

-- AlterTable
ALTER TABLE "Address" DROP CONSTRAINT "Address_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Address_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Address_id_seq";

-- AlterTable
ALTER TABLE "AddressFields" ALTER COLUMN "addressId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Checkout" ALTER COLUMN "addressId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "AddressFields" ADD CONSTRAINT "AddressFields_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
