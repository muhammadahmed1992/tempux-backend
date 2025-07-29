/*
  Warnings:

  - A unique constraint covering the columns `[product_public_id]` on the table `product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `product_public_id` to the `product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_slug` to the `product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "product_reference_number_key";

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "product_public_id" VARCHAR(10) NOT NULL,
ADD COLUMN     "product_slug" VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE "GlobalConfiguration" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(20) NOT NULL,
    "value" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GlobalConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_product_public_id_key" ON "product"("product_public_id");
