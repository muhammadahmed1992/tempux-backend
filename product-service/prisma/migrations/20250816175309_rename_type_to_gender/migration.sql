/*
  Warnings:

  - You are about to drop the column `type_id` on the `product` table. All the data in the column will be lost.
  - You are about to drop the `type` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `gender_id` to the `product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "products"."product" DROP CONSTRAINT "product_type_id_fkey";

-- AlterTable
ALTER TABLE "products"."product" DROP COLUMN "type_id",
ADD COLUMN     "collection_id" INTEGER,
ADD COLUMN     "gender_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "products"."type";

-- CreateTable
CREATE TABLE "products"."gender" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "order" INTEGER,
    "image_url" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "gender_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gender_title_key" ON "products"."gender"("title");

-- AddForeignKey
ALTER TABLE "products"."product" ADD CONSTRAINT "product_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "products"."gender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
