/*
  Warnings:

  - Added the required column `product_Id` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders"."orders" ADD COLUMN     "product_Id" BIGINT NOT NULL;
