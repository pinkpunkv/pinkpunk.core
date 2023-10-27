-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentType" ADD VALUE 'darkcash';
ALTER TYPE "PaymentType" ADD VALUE 'darkcard';

-- CreateTable
CREATE TABLE "AdminLog" (
    "timestamp" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "data" TEXT NOT NULL,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("timestamp")
);

-- AddForeignKey
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
