-- CreateTable
CREATE TABLE "product_analytics" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "product_variant_id" BIGINT NOT NULL,
    "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" BIGINT,
    "updated_at" TIMESTAMPTZ(6),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_analytics_user_id_product_id_product_variant_id_vie_idx" ON "product_analytics"("user_id", "product_id", "product_variant_id", "viewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_analytics_user_id_product_id_product_variant_id_vie_key" ON "product_analytics"("user_id", "product_id", "product_variant_id", "viewed_at");
