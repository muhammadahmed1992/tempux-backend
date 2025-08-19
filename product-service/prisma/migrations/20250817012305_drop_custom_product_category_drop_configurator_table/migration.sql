/*
  Warnings:

  - You are about to drop the column `updated_by` on the `product_analytics` table. All the data in the column will be lost.
  - You are about to drop the `configurator` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `custom_product_category` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "products"."custom_product_category" DROP CONSTRAINT "custom_product_category_product_variant_id_fkey";

-- AlterTable
ALTER TABLE "products"."product_analytics" DROP COLUMN "updated_by";

-- DropTable
DROP TABLE "products"."configurator";

-- DropTable
DROP TABLE "products"."custom_product_category";
