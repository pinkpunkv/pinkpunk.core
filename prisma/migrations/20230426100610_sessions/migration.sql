-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "wans" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Sessions" (
    "session" TEXT NOT NULL,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("session")
);
