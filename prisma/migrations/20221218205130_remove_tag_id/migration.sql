/*
  Warnings:

  - The primary key for the `ProductsTags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Tag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Tag` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductsTags" DROP CONSTRAINT "ProductsTags_tagId_fkey";

-- AlterTable
ALTER TABLE "ProductsTags" DROP CONSTRAINT "ProductsTags_pkey",
ALTER COLUMN "tagId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ProductsTags_pkey" PRIMARY KEY ("productId", "tagId");

-- AlterTable
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Tag_pkey" PRIMARY KEY ("tag");

-- CreateTable
CREATE TABLE "Currency" (
    "symbol" TEXT NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("symbol")
);

-- AddForeignKey
ALTER TABLE "ProductsTags" ADD CONSTRAINT "ProductsTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("tag") ON DELETE RESTRICT ON UPDATE CASCADE;
