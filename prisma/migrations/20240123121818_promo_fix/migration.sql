/*
  Warnings:

  - You are about to drop the `_CheckoutToPromoCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CheckoutToPromoCode" DROP CONSTRAINT "_CheckoutToPromoCode_A_fkey";

-- DropForeignKey
ALTER TABLE "_CheckoutToPromoCode" DROP CONSTRAINT "_CheckoutToPromoCode_B_fkey";

-- AlterTable
ALTER TABLE "Checkout" ADD COLUMN     "promo_id" TEXT;

-- DropTable
DROP TABLE "_CheckoutToPromoCode";

-- AddForeignKey
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "PromoCode"("code") ON DELETE NO ACTION ON UPDATE CASCADE;
