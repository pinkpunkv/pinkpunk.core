/*
  Warnings:

  - The primary key for the `Cart` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `CartVariants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `WishList` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "CartVariants" DROP CONSTRAINT "CartVariants_cartId_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToWishList" DROP CONSTRAINT "_ProductToWishList_B_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_cartId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_wishlistId_fkey";

-- AlterTable
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Cart_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Cart_id_seq";

-- AlterTable
ALTER TABLE "CartVariants" DROP CONSTRAINT "CartVariants_pkey",
ALTER COLUMN "cartId" SET DATA TYPE TEXT,
ADD CONSTRAINT "CartVariants_pkey" PRIMARY KEY ("variantId", "cartId");

-- AlterTable
ALTER TABLE "WishList" DROP CONSTRAINT "WishList_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "WishList_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "WishList_id_seq";

-- AlterTable
ALTER TABLE "_ProductToWishList" ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "cartId" SET DATA TYPE TEXT,
ALTER COLUMN "wishlistId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "WishList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartVariants" ADD CONSTRAINT "CartVariants_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToWishList" ADD CONSTRAINT "_ProductToWishList_B_fkey" FOREIGN KEY ("B") REFERENCES "WishList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
