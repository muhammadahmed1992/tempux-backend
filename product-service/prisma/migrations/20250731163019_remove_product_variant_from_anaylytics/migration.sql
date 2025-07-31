/*
  Warnings:

  - You are about to drop the column `product_variant_id` on the `product_analytics` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,product_id,viewed_at]` on the table `product_analytics` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "product_analytics" DROP CONSTRAINT "product_analytics_product_variant_id_fkey";

-- DropIndex
DROP INDEX "product_analytics_user_id_product_id_product_variant_id_vie_idx";

-- DropIndex
DROP INDEX "product_analytics_user_id_product_id_product_variant_id_vie_key";

-- AlterTable
ALTER TABLE "product_analytics" DROP COLUMN "product_variant_id";

-- CreateIndex
CREATE INDEX "product_analytics_user_id_product_id_viewed_at_idx" ON "product_analytics"("user_id", "product_id", "viewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_analytics_user_id_product_id_viewed_at_key" ON "product_analytics"("user_id", "product_id", "viewed_at");
