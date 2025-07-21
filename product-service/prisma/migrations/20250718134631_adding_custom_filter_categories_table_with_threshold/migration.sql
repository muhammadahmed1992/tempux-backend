-- CreateTable
CREATE TABLE "configurator" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "configurator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_product_category" (
    "id" BIGSERIAL NOT NULL,
    "product_variant_id" BIGINT NOT NULL,
    "custom_filter_configuration_id" BIGINT NOT NULL,
    "valid_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMPTZ(6),

    CONSTRAINT "custom_product_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configurator_key_key" ON "configurator"("key");

-- CreateIndex
CREATE UNIQUE INDEX "custom_product_category_product_variant_id_custom_filter_co_key" ON "custom_product_category"("product_variant_id", "custom_filter_configuration_id");

-- AddForeignKey
ALTER TABLE "custom_product_category" ADD CONSTRAINT "custom_product_category_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
