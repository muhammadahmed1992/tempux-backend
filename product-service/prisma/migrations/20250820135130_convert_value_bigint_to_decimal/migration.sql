/*
  Warnings:

  - You are about to alter the column `value` on the `global_configuration` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "products"."global_configuration" ALTER COLUMN "value" SET DATA TYPE DECIMAL(10,2);
