-- CreateTable
CREATE TABLE "MainSliderSettings" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "title2" TEXT NOT NULL,
    "mainButtonText" TEXT NOT NULL,
    "mainButtonLink" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "subtitleDesc" TEXT NOT NULL,
    "subtitleButtonText" TEXT NOT NULL,
    "subtitleButtonLink" TEXT NOT NULL,

    CONSTRAINT "MainSliderSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MainSliderSettingsToProduct" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_MainSliderSettingsToProduct_AB_unique" ON "_MainSliderSettingsToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_MainSliderSettingsToProduct_B_index" ON "_MainSliderSettingsToProduct"("B");

-- AddForeignKey
ALTER TABLE "_MainSliderSettingsToProduct" ADD CONSTRAINT "_MainSliderSettingsToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "MainSliderSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MainSliderSettingsToProduct" ADD CONSTRAINT "_MainSliderSettingsToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
