-- DropForeignKey
ALTER TABLE "Checkout" DROP CONSTRAINT "Checkout_addressId_fkey";

-- AlterTable
ALTER TABLE "Checkout" ALTER COLUMN "addressId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
