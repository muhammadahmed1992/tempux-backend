/*
  Warnings:

  - You are about to drop the column `collection_id` on the `product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products"."product" DROP COLUMN "collection_id";

-- AlterTable
ALTER TABLE "products"."tags" ADD COLUMN     "key" VARCHAR(20);
