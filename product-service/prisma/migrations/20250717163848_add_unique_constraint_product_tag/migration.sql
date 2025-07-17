/*
  Warnings:

  - A unique constraint covering the columns `[product_id,tag_id]` on the table `product_tag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "product_tag_product_id_tag_id_key" ON "product_tag"("product_id", "tag_id");
