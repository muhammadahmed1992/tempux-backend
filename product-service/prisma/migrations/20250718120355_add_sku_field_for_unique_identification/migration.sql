/*
  Warnings:

  - A unique constraint covering the columns `[sku]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sku` to the `product_variants` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "product_variant_unique_combination";

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "sku" VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_unique_combination" ON "product_variants"("sku");
