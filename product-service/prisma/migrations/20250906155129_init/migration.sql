/*
  Warnings:

  - You are about to drop the `ProductCondition` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "products"."product" DROP CONSTRAINT "product_condition_id_fkey";

-- DropTable
DROP TABLE "products"."ProductCondition";

-- CreateTable
CREATE TABLE "products"."product_condition" (
    "id" SERIAL NOT NULL,
    "condition" VARCHAR(100) NOT NULL,
    "description" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_condition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_condition_condition_key" ON "products"."product_condition"("condition");

-- CreateIndex
CREATE UNIQUE INDEX "product_condition_description_key" ON "products"."product_condition"("description");

-- AddForeignKey
ALTER TABLE "products"."product" ADD CONSTRAINT "product_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "products"."product_condition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
