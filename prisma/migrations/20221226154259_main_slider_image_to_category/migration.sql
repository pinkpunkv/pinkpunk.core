-- CreateTable
CREATE TABLE "_CategoryToImage" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToImage_AB_unique" ON "_CategoryToImage"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToImage_B_index" ON "_CategoryToImage"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToImage" ADD CONSTRAINT "_CategoryToImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToImage" ADD CONSTRAINT "_CategoryToImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
