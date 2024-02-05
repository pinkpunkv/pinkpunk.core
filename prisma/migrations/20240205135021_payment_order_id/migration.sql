/*
  Warnings:

  - You are about to drop the column `transactionId` on the `Checkout` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderId]` on the table `Checkout` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentOrderId]` on the table `Checkout` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Checkout" DROP COLUMN "transactionId",
ADD COLUMN     "paymentOrderId" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Checkout_orderId_key" ON "Checkout"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Checkout_paymentOrderId_key" ON "Checkout"("paymentOrderId");

-- CreateIndex
CREATE INDEX "Checkout_paymentOrderId_idx" ON "Checkout"("paymentOrderId");

-- CreateIndex
CREATE INDEX "Checkout_orderId_idx" ON "Checkout"("orderId");
