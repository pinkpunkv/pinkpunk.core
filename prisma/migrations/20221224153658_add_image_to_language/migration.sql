-- AlterTable
ALTER TABLE "Currency" ADD COLUMN     "imageId" INTEGER;

-- AlterTable
ALTER TABLE "Language" ADD COLUMN     "imageId" INTEGER,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "Language" ADD CONSTRAINT "Language_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Currency" ADD CONSTRAINT "Currency_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
