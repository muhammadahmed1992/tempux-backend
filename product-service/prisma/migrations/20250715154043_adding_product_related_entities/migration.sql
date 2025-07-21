-- CreateTable
CREATE TABLE "color" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(15) NOT NULL,
    "colorCode" VARCHAR(8) NOT NULL,
    "description" VARCHAR(15) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "size" (
    "id" SERIAL NOT NULL,
    "value" INTEGER NOT NULL,
    "widthUnit" VARCHAR(2) NOT NULL DEFAULT 'MM',
    "height" INTEGER NOT NULL,
    "heightUnit" VARCHAR(2) NOT NULL DEFAULT 'MM',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "size_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(25) NOT NULL,
    "order" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "order" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "order" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_exchange" (
    "id" SERIAL NOT NULL,
    "curr" VARCHAR(5) NOT NULL,
    "description" VARCHAR(25) NOT NULL,
    "exchangeRate" DECIMAL(15,2) NOT NULL DEFAULT 1.00,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "currency_exchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rule" (
    "id" SERIAL NOT NULL,
    "taxRate" DECIMAL(15,2) NOT NULL DEFAULT 1.00,
    "description" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tax_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews_ratings" (
    "id" SERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "review" VARCHAR(500) NOT NULL,
    "ratings" SMALLINT NOT NULL,
    "reviewedBy" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reviews_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite" (
    "id" SERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "product_variant_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "description" VARCHAR(100) NOT NULL,
    "valid_from" TIMESTAMPTZ(6),
    "valid_to" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tag" (
    "id" SERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" SERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excel_batch_import" (
    "id" SERIAL NOT NULL,
    "total_records" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "excel_batch_import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "Title" VARCHAR(150),
    "brand_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "type_id" INTEGER NOT NULL,
    "is_accessory" BOOLEAN NOT NULL DEFAULT false,
    "year_of_production" INTEGER NOT NULL,
    "serial_number" VARCHAR(15) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "approval_status_by_admin" VARCHAR(10) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" SERIAL NOT NULL,
    "img_url" VARCHAR(2000) NOT NULL,
    "alt_text" VARCHAR(500) NOT NULL,
    "order" INTEGER NOT NULL,
    "color_id" INTEGER NOT NULL,
    "size_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "product_variant_id" BIGINT,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "color_id" INTEGER NOT NULL,
    "bracelet_color_id" INTEGER NOT NULL,
    "dial_color_id" INTEGER NOT NULL,
    "size_id" INTEGER NOT NULL,
    "movement_id" BIGINT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "original_box_and_paper" BOOLEAN NOT NULL,
    "original_box" BOOLEAN NOT NULL,
    "original_paper" BOOLEAN NOT NULL,
    "accessories" BOOLEAN NOT NULL,
    "case_material" VARCHAR(15),
    "bracelet_material" VARCHAR(15),
    "currency_id" INTEGER NOT NULL,
    "tax_rule_id" INTEGER NOT NULL,
    "seller_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownership_proof" (
    "id" BIGSERIAL NOT NULL,
    "image_url" VARCHAR(1000) NOT NULL,
    "alt_text" VARCHAR(500) NOT NULL,
    "order" INTEGER NOT NULL,
    "product_id" BIGINT NOT NULL,
    "product_variant_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ownership_proof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_of_wear" (
    "id" BIGSERIAL NOT NULL,
    "image_url" VARCHAR(1000) NOT NULL,
    "alt_text" VARCHAR(500) NOT NULL,
    "order" INTEGER NOT NULL,
    "product_id" BIGINT NOT NULL,
    "product_variant_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sign_of_wear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_ratings_product_id_reviewedBy_key" ON "reviews_ratings"("product_id", "reviewedBy");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_user_id_product_id_product_variant_id_key" ON "favorite"("user_id", "product_id", "product_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_user_id_product_id_key" ON "cart"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_brand_id_category_id_type_id_key" ON "product"("brand_id", "category_id", "type_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_unique_combination" ON "product_variants"("product_id", "color_id", "size_id");

-- CreateIndex
CREATE UNIQUE INDEX "ownership_proof_product_id_product_variant_id_key" ON "ownership_proof"("product_id", "product_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sign_of_wear_product_id_product_variant_id_key" ON "sign_of_wear"("product_id", "product_variant_id");

-- AddForeignKey
ALTER TABLE "reviews_ratings" ADD CONSTRAINT "reviews_ratings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag" ADD CONSTRAINT "product_tag_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag" ADD CONSTRAINT "product_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "movement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_bracelet_color_id_fkey" FOREIGN KEY ("bracelet_color_id") REFERENCES "color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_dial_color_id_fkey" FOREIGN KEY ("dial_color_id") REFERENCES "color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency_exchange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tax_rule_id_fkey" FOREIGN KEY ("tax_rule_id") REFERENCES "tax_rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_proof" ADD CONSTRAINT "ownership_proof_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_proof" ADD CONSTRAINT "ownership_proof_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_of_wear" ADD CONSTRAINT "sign_of_wear_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_of_wear" ADD CONSTRAINT "sign_of_wear_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
