/*
  Warnings:

  - The primary key for the `Checkout` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `CheckoutVariants` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "CheckoutVariants" DROP CONSTRAINT "CheckoutVariants_checkoutId_fkey";

-- AlterTable
ALTER TABLE "Checkout" DROP CONSTRAINT "Checkout_pkey",
ADD COLUMN     "infoId" INTEGER,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Checkout_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Checkout_id_seq";

-- AlterTable
ALTER TABLE "CheckoutVariants" DROP CONSTRAINT "CheckoutVariants_pkey",
ALTER COLUMN "checkoutId" SET DATA TYPE TEXT,
ADD CONSTRAINT "CheckoutVariants_pkey" PRIMARY KEY ("checkoutId", "variantId");

-- CreateTable
CREATE TABLE "CheckoutInfo" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "CheckoutInfo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_infoId_fkey" FOREIGN KEY ("infoId") REFERENCES "CheckoutInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutVariants" ADD CONSTRAINT "CheckoutVariants_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "Checkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
