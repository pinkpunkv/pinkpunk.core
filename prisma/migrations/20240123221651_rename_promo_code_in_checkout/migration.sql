/*
  Warnings:

  - You are about to drop the column `promo_id` on the `Checkout` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Checkout" DROP CONSTRAINT "Checkout_promo_id_fkey";

-- AlterTable
ALTER TABLE "Checkout" DROP COLUMN "promo_id",
ADD COLUMN     "code" TEXT;

-- AddForeignKey
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_code_fkey" FOREIGN KEY ("code") REFERENCES "PromoCode"("code") ON DELETE NO ACTION ON UPDATE CASCADE;
