/*
  Warnings:

  - You are about to drop the column `data_type` on the `attributes` table. All the data in the column will be lost.
  - Added the required column `column_name` to the `attributes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products"."attributes" DROP COLUMN "data_type",
ADD COLUMN     "column_name" INTEGER NOT NULL;
