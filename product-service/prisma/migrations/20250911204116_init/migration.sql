/*
  Warnings:

  - You are about to drop the `movement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "products"."product_items" DROP CONSTRAINT "product_items_movement_id_fkey";

-- DropTable
DROP TABLE "products"."movement";
