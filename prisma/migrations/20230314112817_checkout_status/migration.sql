/*
  Warnings:

  - Added the required column `status` to the `Checkout` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('preprocess', 'pending', 'completed');

-- AlterTable
ALTER TABLE "Checkout" ADD COLUMN     "status" "CheckoutStatus" NOT NULL;
