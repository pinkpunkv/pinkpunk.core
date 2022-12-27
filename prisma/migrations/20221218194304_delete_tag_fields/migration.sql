/*
  Warnings:

  - You are about to drop the `_FieldToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_FieldToTag" DROP CONSTRAINT "_FieldToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_FieldToTag" DROP CONSTRAINT "_FieldToTag_B_fkey";

-- DropTable
DROP TABLE "_FieldToTag";
