-- AlterTable
ALTER TABLE "Checkout" ADD COLUMN     "cartId" TEXT;

-- AddForeignKey
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
