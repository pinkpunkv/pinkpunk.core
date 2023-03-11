-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('pickup', 'courier', 'parcel');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "views" BIGINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Address" (
    "id" SERIAL NOT NULL,
    "postalCode" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL DEFAULT 'pickup',
    "transactionId" INTEGER NOT NULL,
    "addressId" INTEGER NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OrderToVariant" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_OrderToVariant_AB_unique" ON "_OrderToVariant"("A", "B");

-- CreateIndex
CREATE INDEX "_OrderToVariant_B_index" ON "_OrderToVariant"("B");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderToVariant" ADD CONSTRAINT "_OrderToVariant_A_fkey" FOREIGN KEY ("A") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderToVariant" ADD CONSTRAINT "_OrderToVariant_B_fkey" FOREIGN KEY ("B") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
