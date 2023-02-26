/*
  Warnings:

  - You are about to drop the `_CartToVariant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CartToVariant" DROP CONSTRAINT "_CartToVariant_A_fkey";

-- DropForeignKey
ALTER TABLE "_CartToVariant" DROP CONSTRAINT "_CartToVariant_B_fkey";

-- DropTable
DROP TABLE "_CartToVariant";

-- CreateTable
CREATE TABLE "CartVariants" (
    "cartId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "variantId" INTEGER NOT NULL,

    CONSTRAINT "CartVariants_pkey" PRIMARY KEY ("variantId","cartId")
);

-- AddForeignKey
ALTER TABLE "CartVariants" ADD CONSTRAINT "CartVariants_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartVariants" ADD CONSTRAINT "CartVariants_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
