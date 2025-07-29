/*
  Warnings:

  - You are about to drop the `GlobalConfiguration` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "GlobalConfiguration";

-- CreateTable
CREATE TABLE "global_configuration" (
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

    CONSTRAINT "global_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "global_configuration_key_key" ON "global_configuration"("key");
