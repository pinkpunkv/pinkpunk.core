-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionValue" (
    "id" INTEGER NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldValue" TEXT NOT NULL,

    CONSTRAINT "OptionValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" SERIAL NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldValue" TEXT NOT NULL,
    "languageId" INTEGER NOT NULL,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionsValues" (
    "optiontId" TEXT NOT NULL,
    "valueId" INTEGER NOT NULL,

    CONSTRAINT "OptionsValues_pkey" PRIMARY KEY ("valueId","optiontId")
);

-- CreateTable
CREATE TABLE "ProductsTags" (
    "productId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "ProductsTags_pkey" PRIMARY KEY ("productId","tagId")
);

-- CreateTable
CREATE TABLE "ProductsImages" (
    "productId" INTEGER NOT NULL,
    "imageId" INTEGER NOT NULL,

    CONSTRAINT "ProductsImages_pkey" PRIMARY KEY ("productId","imageId")
);

-- CreateTable
CREATE TABLE "ModelsFields" (
    "objectId" INTEGER NOT NULL,
    "objectType" TEXT NOT NULL,
    "fieldId" INTEGER NOT NULL,

    CONSTRAINT "ModelsFields_pkey" PRIMARY KEY ("objectId","fieldId","objectType")
);

-- CreateTable
CREATE TABLE "_FieldToOption" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FieldToProduct" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_path_key" ON "Product"("path");

-- CreateIndex
CREATE UNIQUE INDEX "Language_symbol_key" ON "Language"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "_FieldToOption_AB_unique" ON "_FieldToOption"("A", "B");

-- CreateIndex
CREATE INDEX "_FieldToOption_B_index" ON "_FieldToOption"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FieldToProduct_AB_unique" ON "_FieldToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_FieldToProduct_B_index" ON "_FieldToProduct"("B");

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionsValues" ADD CONSTRAINT "OptionsValues_optiontId_fkey" FOREIGN KEY ("optiontId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionsValues" ADD CONSTRAINT "OptionsValues_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "OptionValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductsTags" ADD CONSTRAINT "ProductsTags_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductsTags" ADD CONSTRAINT "ProductsTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductsImages" ADD CONSTRAINT "ProductsImages_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductsImages" ADD CONSTRAINT "ProductsImages_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelsFields" ADD CONSTRAINT "ModelsFields_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FieldToOption" ADD CONSTRAINT "_FieldToOption_A_fkey" FOREIGN KEY ("A") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FieldToOption" ADD CONSTRAINT "_FieldToOption_B_fkey" FOREIGN KEY ("B") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FieldToProduct" ADD CONSTRAINT "_FieldToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FieldToProduct" ADD CONSTRAINT "_FieldToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
