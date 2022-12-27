-- AlterTable
ALTER TABLE "ProductsImages" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isMain" BOOLEAN NOT NULL DEFAULT false;
