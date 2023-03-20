-- DropIndex
DROP INDEX "Variant_size_color_key";

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;
