/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `brand` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `color` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[value,height]` on the table `size` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `type` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "brand_title_key" ON "brand"("title");

-- CreateIndex
CREATE UNIQUE INDEX "category_title_key" ON "category"("title");

-- CreateIndex
CREATE UNIQUE INDEX "color_name_key" ON "color"("name");

-- CreateIndex
CREATE UNIQUE INDEX "size_value_height_key" ON "size"("value", "height");

-- CreateIndex
CREATE UNIQUE INDEX "type_title_key" ON "type"("title");
