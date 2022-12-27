-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "currencySymbol" TEXT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_currencySymbol_fkey" FOREIGN KEY ("currencySymbol") REFERENCES "Currency"("symbol") ON DELETE SET NULL ON UPDATE CASCADE;
