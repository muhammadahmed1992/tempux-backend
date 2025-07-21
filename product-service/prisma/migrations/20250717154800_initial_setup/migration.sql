/*
  Warnings:

  - A unique constraint covering the columns `[curr]` on the table `currency_exchange` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `movement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reference_number]` on the table `product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reference_number` to the `product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "product_brand_id_category_id_type_id_key";

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "reference_number" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "currency_exchange_curr_key" ON "currency_exchange"("curr");

-- CreateIndex
CREATE UNIQUE INDEX "movement_title_key" ON "movement"("title");

-- CreateIndex
CREATE UNIQUE INDEX "product_reference_number_key" ON "product"("reference_number");
