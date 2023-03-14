/*
  Warnings:

  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_OrderToVariant` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `addressName` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_addressId_fkey";

-- DropForeignKey
ALTER TABLE "_OrderToVariant" DROP CONSTRAINT "_OrderToVariant_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrderToVariant" DROP CONSTRAINT "_OrderToVariant_B_fkey";

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "addressName" TEXT NOT NULL;

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "_OrderToVariant";

-- CreateTable
CREATE TABLE "AddressFields" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "addressId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "streetNumber" TEXT NOT NULL,
    "apartments" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "AddressFields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkout" (
    "id" SERIAL NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL DEFAULT 'pickup',
    "transactionId" INTEGER NOT NULL,
    "addressId" INTEGER NOT NULL,

    CONSTRAINT "Checkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckoutVariants" (
    "checkoutId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "variantId" INTEGER NOT NULL,

    CONSTRAINT "CheckoutVariants_pkey" PRIMARY KEY ("checkoutId","variantId")
);

-- AddForeignKey
ALTER TABLE "AddressFields" ADD CONSTRAINT "AddressFields_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutVariants" ADD CONSTRAINT "CheckoutVariants_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "Checkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutVariants" ADD CONSTRAINT "CheckoutVariants_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
