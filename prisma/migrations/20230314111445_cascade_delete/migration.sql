-- DropForeignKey
ALTER TABLE "AddressFields" DROP CONSTRAINT "AddressFields_addressId_fkey";

-- AddForeignKey
ALTER TABLE "AddressFields" ADD CONSTRAINT "AddressFields_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE CASCADE ON UPDATE CASCADE;
