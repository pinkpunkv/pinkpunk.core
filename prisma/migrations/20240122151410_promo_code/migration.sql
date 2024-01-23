-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('multi', 'sigle');

-- CreateTable
CREATE TABLE "PromoCode" (
    "code" TEXT NOT NULL,
    "type" "PromoType" NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "PromoMapping" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "vaue" TEXT NOT NULL,

    CONSTRAINT "PromoMapping_pkey" PRIMARY KEY ("code","label")
);

-- CreateTable
CREATE TABLE "_CheckoutToPromoCode" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CheckoutToPromoCode_AB_unique" ON "_CheckoutToPromoCode"("A", "B");

-- CreateIndex
CREATE INDEX "_CheckoutToPromoCode_B_index" ON "_CheckoutToPromoCode"("B");

-- AddForeignKey
ALTER TABLE "PromoMapping" ADD CONSTRAINT "PromoMapping_code_fkey" FOREIGN KEY ("code") REFERENCES "PromoCode"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CheckoutToPromoCode" ADD CONSTRAINT "_CheckoutToPromoCode_A_fkey" FOREIGN KEY ("A") REFERENCES "Checkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CheckoutToPromoCode" ADD CONSTRAINT "_CheckoutToPromoCode_B_fkey" FOREIGN KEY ("B") REFERENCES "PromoCode"("code") ON DELETE CASCADE ON UPDATE CASCADE;
