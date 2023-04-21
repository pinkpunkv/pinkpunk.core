-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('confirm', 'order', 'forgot');

-- AlterTable
ALTER TABLE "Checkout" ADD COLUMN     "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Token" (
    "token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "objectId" TEXT NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("token")
);
