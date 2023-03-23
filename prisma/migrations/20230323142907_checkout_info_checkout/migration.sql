-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('cash', 'card', 'online');

-- AlterTable
ALTER TABLE "Checkout" ADD COLUMN     "orderId" SERIAL NOT NULL,
ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'cash';

-- AlterTable
ALTER TABLE "CheckoutInfo" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;
