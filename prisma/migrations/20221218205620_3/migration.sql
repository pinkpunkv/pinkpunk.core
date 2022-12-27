-- CreateTable
CREATE TABLE "_CollectionToField" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CollectionToField_AB_unique" ON "_CollectionToField"("A", "B");

-- CreateIndex
CREATE INDEX "_CollectionToField_B_index" ON "_CollectionToField"("B");

-- AddForeignKey
ALTER TABLE "_CollectionToField" ADD CONSTRAINT "_CollectionToField_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionToField" ADD CONSTRAINT "_CollectionToField_B_fkey" FOREIGN KEY ("B") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
