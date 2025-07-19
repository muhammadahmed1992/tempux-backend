/*
  Warnings:

  - Added the required column `product_variant_id` to the `cart` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cart" ADD COLUMN     "product_variant_id" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
