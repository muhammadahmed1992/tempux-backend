/*
  Warnings:

  - You are about to drop the column `Title` on the `product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product" DROP COLUMN "Title",
ADD COLUMN     "title" VARCHAR(150);
