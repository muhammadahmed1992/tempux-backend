/*
  Warnings:

  - You are about to drop the column `address_type` on the `addresses` table. All the data in the column will be lost.
  - Added the required column `address_type_id` to the `addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users"."addresses" DROP COLUMN "address_type",
ADD COLUMN     "address_type_id" BIGINT NOT NULL;

-- DropEnum
DROP TYPE "users"."AddressType";

-- CreateTable
CREATE TABLE "users"."address_types" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "address_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "address_types_name_key" ON "users"."address_types"("name");

-- AddForeignKey
ALTER TABLE "users"."addresses" ADD CONSTRAINT "addresses_address_type_id_fkey" FOREIGN KEY ("address_type_id") REFERENCES "users"."address_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
