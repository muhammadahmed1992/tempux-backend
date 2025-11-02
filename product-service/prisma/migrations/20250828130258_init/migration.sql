/*
  Warnings:

  - You are about to drop the column `product_variant_id` on the `cart` table. All the data in the column will be lost.
  - You are about to drop the column `product_variant_id` on the `favorite` table. All the data in the column will be lost.
  - You are about to drop the column `product_variant_id` on the `ownership_proof` table. All the data in the column will be lost.
  - You are about to drop the column `approval_status_by_admin` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `approximation` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `buyer_confidence_boost_description` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `reference_number` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `serial_number` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `unknown` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `year_of_production` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `product_variant_id` on the `product_analytics` table. All the data in the column will be lost.
  - You are about to drop the column `product_variant_id` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `product_variant_id` on the `sign_of_wear` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `size` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `size` table. All the data in the column will be lost.
  - You are about to drop the `product_variants` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id,product_id,product_item_id]` on the table `cart` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,product_id,product_item_id]` on the table `favorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[product_id,product_item_id]` on the table `ownership_proof` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[product_id,product_item_id]` on the table `sign_of_wear` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[caseWidth,caseHeight]` on the table `size` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `product_item_id` to the `cart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_item_id` to the `favorite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_item_id` to the `ownership_proof` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_item_id` to the `product_analytics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_item_id` to the `sign_of_wear` table without a default value. This is not possible if the table is not empty.
  - Added the required column `caseHeight` to the `size` table without a default value. This is not possible if the table is not empty.
  - Added the required column `caseWidth` to the `size` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "products"."cart" DROP CONSTRAINT "cart_product_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."favorite" DROP CONSTRAINT "favorite_product_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."ownership_proof" DROP CONSTRAINT "ownership_proof_product_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product_analytics" DROP CONSTRAINT "product_analytics_product_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product_images" DROP CONSTRAINT "product_images_product_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product_variants" DROP CONSTRAINT "product_variants_bracelet_color_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product_variants" DROP CONSTRAINT "product_variants_color_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product_variants" DROP CONSTRAINT "product_variants_currency_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product_variants" DROP CONSTRAINT "product_variants_dial_color_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product_variants" DROP CONSTRAINT "product_variants_movement_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product_variants" DROP CONSTRAINT "product_variants_product_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product_variants" DROP CONSTRAINT "product_variants_size_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."product_variants" DROP CONSTRAINT "product_variants_tax_rule_id_fkey";

-- DropForeignKey
ALTER TABLE "products"."sign_of_wear" DROP CONSTRAINT "sign_of_wear_product_variant_id_fkey";

-- DropIndex
DROP INDEX "products"."cart_user_id_product_id_product_variant_id_key";

-- DropIndex
DROP INDEX "products"."favorite_user_id_product_id_product_variant_id_key";

-- DropIndex
DROP INDEX "products"."ownership_proof_product_id_product_variant_id_key";

-- DropIndex
DROP INDEX "products"."sign_of_wear_product_id_product_variant_id_key";

-- DropIndex
DROP INDEX "products"."size_value_height_key";

-- AlterTable
ALTER TABLE "products"."cart" DROP COLUMN "product_variant_id",
ADD COLUMN     "product_item_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "products"."favorite" DROP COLUMN "product_variant_id",
ADD COLUMN     "product_item_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "products"."ownership_proof" DROP COLUMN "product_variant_id",
ADD COLUMN     "product_item_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "products"."product" DROP COLUMN "approval_status_by_admin",
DROP COLUMN "approximation",
DROP COLUMN "buyer_confidence_boost_description",
DROP COLUMN "reference_number",
DROP COLUMN "serial_number",
DROP COLUMN "unknown",
DROP COLUMN "year_of_production";

-- AlterTable
ALTER TABLE "products"."product_analytics" DROP COLUMN "product_variant_id",
ADD COLUMN     "product_item_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "products"."product_images" DROP COLUMN "product_variant_id",
ADD COLUMN     "product_item_id" BIGINT;

-- AlterTable
ALTER TABLE "products"."sign_of_wear" DROP COLUMN "product_variant_id",
ADD COLUMN     "product_item_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "products"."size" DROP COLUMN "height",
DROP COLUMN "value",
ADD COLUMN     "caseHeight" INTEGER NOT NULL,
ADD COLUMN     "caseWidth" INTEGER NOT NULL;

-- DropTable
DROP TABLE "products"."product_variants";

-- CreateTable
CREATE TABLE "products"."product_items" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "title" TEXT,
    "color_id" INTEGER NOT NULL,
    "bracelet_color_id" INTEGER NOT NULL,
    "dial_color_id" INTEGER NOT NULL,
    "size_id" INTEGER NOT NULL,
    "movement_id" BIGINT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "gender_id" INTEGER,
    "year_of_production" INTEGER NOT NULL,
    "serial_number" VARCHAR(15) NOT NULL,
    "reference_number" TEXT NOT NULL,
    "approval_status_by_admin" VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    "approximation" BOOLEAN NOT NULL DEFAULT false,
    "buyer_confidence_boost_description" VARCHAR(5000),
    "unknown" BOOLEAN NOT NULL DEFAULT false,
    "original_box_and_paper" BOOLEAN NOT NULL,
    "original_box" BOOLEAN NOT NULL,
    "original_paper" BOOLEAN NOT NULL,
    "accessories" BOOLEAN NOT NULL,
    "crystal_id" INTEGER,
    "case_material_id" INTEGER,
    "bracelet_material_id" INTEGER,
    "complication_id" INTEGER,
    "release_date" TIMESTAMPTZ(6),
    "country_id" INTEGER,
    "availability_id" INTEGER,
    "currency_id" INTEGER NOT NULL,
    "tax_rule_id" INTEGER NOT NULL,
    "seller_id" BIGINT,
    "power_reserve" INTEGER NOT NULL,
    "base_image_url" VARCHAR(1000) NOT NULL,
    "sku" VARCHAR(20) NOT NULL,
    "discount" DECIMAL(10,2) DEFAULT 0.00,
    "warranty" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."availability" (
    "id" SERIAL NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."complications" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "complications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."material" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."crystal" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "crystal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."country" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."product_listings" (
    "id" SERIAL NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "caseMaterial" TEXT NOT NULL,
    "caseDiameterMm" DOUBLE PRECISION NOT NULL,
    "caseThicknessMm" DOUBLE PRECISION NOT NULL,
    "dialColor" TEXT NOT NULL,
    "strapMaterial" TEXT NOT NULL,
    "strapColor" TEXT NOT NULL,
    "waterResistanceM" INTEGER NOT NULL,
    "crystalType" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "powerReserveHours" INTEGER NOT NULL,
    "complications" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "warrantyYears" INTEGER NOT NULL,
    "countryOfOrigin" TEXT NOT NULL,

    CONSTRAINT "product_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_items_sku_key" ON "products"."product_items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "cart_user_id_product_id_product_item_id_key" ON "products"."cart"("user_id", "product_id", "product_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_user_id_product_id_product_item_id_key" ON "products"."favorite"("user_id", "product_id", "product_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "ownership_proof_product_id_product_item_id_key" ON "products"."ownership_proof"("product_id", "product_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "sign_of_wear_product_id_product_item_id_key" ON "products"."sign_of_wear"("product_id", "product_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "size_caseWidth_caseHeight_key" ON "products"."size"("caseWidth", "caseHeight");

-- AddForeignKey
ALTER TABLE "products"."favorite" ADD CONSTRAINT "favorite_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "products"."product_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."cart" ADD CONSTRAINT "cart_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "products"."product_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_images" ADD CONSTRAINT "product_images_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "products"."product_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_case_material_id_fkey" FOREIGN KEY ("case_material_id") REFERENCES "products"."material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_bracelet_material_id_fkey" FOREIGN KEY ("bracelet_material_id") REFERENCES "products"."material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_bracelet_color_id_fkey" FOREIGN KEY ("bracelet_color_id") REFERENCES "products"."color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "products"."color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "products"."currency_exchange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_dial_color_id_fkey" FOREIGN KEY ("dial_color_id") REFERENCES "products"."color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "products"."movement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "products"."size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_tax_rule_id_fkey" FOREIGN KEY ("tax_rule_id") REFERENCES "products"."tax_rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "products"."gender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_crystal_id_fkey" FOREIGN KEY ("crystal_id") REFERENCES "products"."crystal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_availability_id_fkey" FOREIGN KEY ("availability_id") REFERENCES "products"."availability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "products"."country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_complication_id_fkey" FOREIGN KEY ("complication_id") REFERENCES "products"."complications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."ownership_proof" ADD CONSTRAINT "ownership_proof_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "products"."product_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."sign_of_wear" ADD CONSTRAINT "sign_of_wear_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "products"."product_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_analytics" ADD CONSTRAINT "product_analytics_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "products"."product_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
