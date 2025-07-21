/*
  Warnings:

  - A unique constraint covering the columns `[user_id,product_id,product_variant_id]` on the table `cart` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "cart_user_id_product_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "cart_user_id_product_id_product_variant_id_key" ON "cart"("user_id", "product_id", "product_variant_id");
