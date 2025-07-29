/*
  Warnings:

  - You are about to drop the `discounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_variant_discounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "product_variant_discounts" DROP CONSTRAINT "product_variant_discounts_discount_id_fkey";

-- DropForeignKey
ALTER TABLE "product_variant_discounts" DROP CONSTRAINT "product_variant_discounts_product_variant_id_fkey";

-- DropTable
DROP TABLE "discounts";

-- DropTable
DROP TABLE "product_variant_discounts";

-- DropEnum
DROP TYPE "DiscountType";
