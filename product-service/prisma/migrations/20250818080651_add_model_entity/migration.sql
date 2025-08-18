/*
  Warnings:

  - You are about to drop the column `collection_id` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `product_public_id` on the `product` table. All the data in the column will be lost.
  - You are about to drop the `collection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "products"."collection" DROP CONSTRAINT "collection_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product" DROP CONSTRAINT "product_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product" DROP CONSTRAINT "product_category_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product" DROP CONSTRAINT "product_collection_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product" DROP CONSTRAINT "product_gender_id_fkey";

-- DropIndex
DROP INDEX "products"."product_collection_id_idx";

-- DropIndex
DROP INDEX "products"."product_product_public_id_key";

-- AlterTable
ALTER TABLE "products"."product" DROP COLUMN "collection_id",
DROP COLUMN "product_public_id",
ADD COLUMN     "model_id" INTEGER,
ALTER COLUMN "brand_id" DROP NOT NULL,
ALTER COLUMN "category_id" DROP NOT NULL,
ALTER COLUMN "gender_id" DROP NOT NULL;

-- DropTable
DROP TABLE "products"."collection";

-- CreateTable
CREATE TABLE "products"."model" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "order" INTEGER,
    "image_url" VARCHAR(1000),
    "brand_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "model_brand_id_title_key" ON "products"."model"("brand_id", "title");

-- AddForeignKey
ALTER TABLE "products"."model" ADD CONSTRAINT "model_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "products"."brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product" ADD CONSTRAINT "product_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "products"."brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "products"."category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product" ADD CONSTRAINT "product_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "products"."model"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product" ADD CONSTRAINT "product_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "products"."gender"("id") ON DELETE SET NULL ON UPDATE CASCADE;
