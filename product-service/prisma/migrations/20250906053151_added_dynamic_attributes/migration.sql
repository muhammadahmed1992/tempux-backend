-- CreateTable
CREATE TABLE "products"."color" (
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
CREATE TABLE "products"."size" (
    "id" SERIAL NOT NULL,
    "caseWidth" INTEGER NOT NULL,
    "widthUnit" VARCHAR(2) NOT NULL DEFAULT 'MM',
    "caseHeight" INTEGER NOT NULL,
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
CREATE TABLE "products"."brand" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(25) NOT NULL,
    "order" INTEGER,
    "image_url" VARCHAR(1000),
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
CREATE TABLE "products"."model" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "order" INTEGER,
    "image_url" VARCHAR(1000),
    "brand_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."gender" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "order" INTEGER,
    "image_url" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "gender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."category" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "order" INTEGER,
    "image_url" VARCHAR(1000),
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
CREATE TABLE "products"."currency_exchange" (
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
CREATE TABLE "products"."tax_rule" (
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
CREATE TABLE "products"."product_attribute_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_attribute_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."attributes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(200),
    "data_type" VARCHAR(20) NOT NULL,
    "unit" VARCHAR(10),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."attribute_category_mapping" (
    "id" SERIAL NOT NULL,
    "attribute_category_id" INTEGER NOT NULL,
    "attribute_id" INTEGER NOT NULL,
    "data_type" VARCHAR(20) NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "attribute_category_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."product_attribute_value_mapping" (
    "id" BIGSERIAL NOT NULL,
    "attribute_category_mapping_id" INTEGER NOT NULL,
    "product_id" BIGINT NOT NULL,
    "string_value" VARCHAR(500),
    "number_value" DECIMAL(15,4),
    "boolean_value" BOOLEAN,
    "date_value" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_attribute_value_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."reviews_ratings" (
    "id" SERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "review" VARCHAR(500),
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
CREATE TABLE "products"."favorite" (
    "id" SERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "product_item_id" BIGINT NOT NULL,
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
CREATE TABLE "products"."tags" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(20),
    "title" VARCHAR(20) NOT NULL,
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
CREATE TABLE "products"."product_tag" (
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
CREATE TABLE "products"."cart" (
    "id" SERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "product_item_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
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
CREATE TABLE "products"."excel_batch_import" (
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
CREATE TABLE "products"."product" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "title" VARCHAR(150),
    "brand_id" INTEGER,
    "category_id" INTEGER,
    "model_id" INTEGER,
    "gender_id" INTEGER,
    "is_accessory" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "product_slug" VARCHAR(255) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."product_images" (
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
    "product_item_id" BIGINT,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."product_items" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "title" TEXT,
    "color_id" INTEGER NOT NULL,
    "bracelet_color_id" INTEGER NOT NULL,
    "dial_color_id" INTEGER NOT NULL,
    "size_id" INTEGER NOT NULL,
    "movement_id" BIGINT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "gender_id" INTEGER,
    "year_of_production" INTEGER NOT NULL,
    "serial_number" VARCHAR(15) NOT NULL,
    "reference_number" TEXT NOT NULL,
    "approval_status_by_admin" VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    "approximation" BOOLEAN NOT NULL DEFAULT false,
    "buyer_confidence_boost_description" VARCHAR(5000),
    "unknown" BOOLEAN NOT NULL DEFAULT false,
    "original_box_and_paper" BOOLEAN NOT NULL,
    "original_box" BOOLEAN NOT NULL,
    "original_paper" BOOLEAN NOT NULL,
    "accessories" BOOLEAN NOT NULL,
    "crystal_id" INTEGER,
    "case_material_id" INTEGER,
    "bracelet_material_id" INTEGER,
    "complication_id" INTEGER,
    "release_date" TIMESTAMPTZ(6),
    "country_id" INTEGER,
    "availability_id" INTEGER,
    "currency_id" INTEGER NOT NULL,
    "tax_rule_id" INTEGER NOT NULL,
    "seller_id" BIGINT,
    "power_reserve" INTEGER NOT NULL,
    "base_image_url" VARCHAR(1000) NOT NULL,
    "sku" VARCHAR(20) NOT NULL,
    "discount" DECIMAL(10,2) DEFAULT 0.00,
    "warranty" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."availability" (
    "id" SERIAL NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."complications" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "complications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."material" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."crystal" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "crystal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."country" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."movement" (
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
CREATE TABLE "products"."ownership_proof" (
    "id" BIGSERIAL NOT NULL,
    "image_url" VARCHAR(1000) NOT NULL,
    "alt_text" VARCHAR(500) NOT NULL,
    "order" INTEGER NOT NULL,
    "product_id" BIGINT NOT NULL,
    "product_item_id" BIGINT NOT NULL,
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
CREATE TABLE "products"."sign_of_wear" (
    "id" BIGSERIAL NOT NULL,
    "image_url" VARCHAR(1000) NOT NULL,
    "alt_text" VARCHAR(500) NOT NULL,
    "order" INTEGER NOT NULL,
    "product_id" BIGINT NOT NULL,
    "product_item_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sign_of_wear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."global_configuration" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "global_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."product_analytics" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "product_item_id" BIGINT NOT NULL,

    CONSTRAINT "product_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products"."product_listings" (
    "id" SERIAL NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "caseMaterial" TEXT NOT NULL,
    "caseDiameterMm" DOUBLE PRECISION NOT NULL,
    "caseThicknessMm" DOUBLE PRECISION NOT NULL,
    "dialColor" TEXT NOT NULL,
    "strapMaterial" TEXT NOT NULL,
    "strapColor" TEXT NOT NULL,
    "waterResistanceM" INTEGER NOT NULL,
    "crystalType" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "powerReserveHours" INTEGER NOT NULL,
    "complications" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "warrantyYears" INTEGER NOT NULL,
    "countryOfOrigin" TEXT NOT NULL,

    CONSTRAINT "product_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "color_name_key" ON "products"."color"("name");

-- CreateIndex
CREATE UNIQUE INDEX "size_caseWidth_caseHeight_key" ON "products"."size"("caseWidth", "caseHeight");

-- CreateIndex
CREATE UNIQUE INDEX "brand_title_key" ON "products"."brand"("title");

-- CreateIndex
CREATE UNIQUE INDEX "model_brand_id_title_key" ON "products"."model"("brand_id", "title");

-- CreateIndex
CREATE UNIQUE INDEX "gender_title_key" ON "products"."gender"("title");

-- CreateIndex
CREATE UNIQUE INDEX "category_title_key" ON "products"."category"("title");

-- CreateIndex
CREATE UNIQUE INDEX "currency_exchange_curr_key" ON "products"."currency_exchange"("curr");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rule_description_key" ON "products"."tax_rule"("description");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_categories_name_key" ON "products"."product_attribute_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attributes_name_key" ON "products"."attributes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_category_mapping_attribute_category_id_attribute__key" ON "products"."attribute_category_mapping"("attribute_category_id", "attribute_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_value_mapping_attribute_category_mapping__key" ON "products"."product_attribute_value_mapping"("attribute_category_mapping_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_ratings_product_id_reviewedBy_key" ON "products"."reviews_ratings"("product_id", "reviewedBy");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_user_id_product_id_product_item_id_key" ON "products"."favorite"("user_id", "product_id", "product_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_title_key" ON "products"."tags"("title");

-- CreateIndex
CREATE UNIQUE INDEX "product_tag_product_id_tag_id_key" ON "products"."product_tag"("product_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_user_id_product_id_product_item_id_key" ON "products"."cart"("user_id", "product_id", "product_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_items_sku_key" ON "products"."product_items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "movement_title_key" ON "products"."movement"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ownership_proof_product_id_product_item_id_key" ON "products"."ownership_proof"("product_id", "product_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "sign_of_wear_product_id_product_item_id_key" ON "products"."sign_of_wear"("product_id", "product_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "global_configuration_key_key" ON "products"."global_configuration"("key");

-- CreateIndex
CREATE INDEX "product_analytics_user_id_product_id_viewed_at_idx" ON "products"."product_analytics"("user_id", "product_id", "viewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_analytics_user_id_product_id_viewed_at_key" ON "products"."product_analytics"("user_id", "product_id", "viewed_at");

-- AddForeignKey
ALTER TABLE "products"."model" ADD CONSTRAINT "model_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "products"."brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."attribute_category_mapping" ADD CONSTRAINT "attribute_category_mapping_attribute_category_id_fkey" FOREIGN KEY ("attribute_category_id") REFERENCES "products"."product_attribute_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."attribute_category_mapping" ADD CONSTRAINT "attribute_category_mapping_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "products"."attributes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_attribute_value_mapping" ADD CONSTRAINT "product_attribute_value_mapping_attribute_category_mapping_fkey" FOREIGN KEY ("attribute_category_mapping_id") REFERENCES "products"."attribute_category_mapping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_attribute_value_mapping" ADD CONSTRAINT "product_attribute_value_mapping_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."reviews_ratings" ADD CONSTRAINT "reviews_ratings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."favorite" ADD CONSTRAINT "favorite_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."favorite" ADD CONSTRAINT "favorite_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "products"."product_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_tag" ADD CONSTRAINT "product_tag_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_tag" ADD CONSTRAINT "product_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "products"."tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."cart" ADD CONSTRAINT "cart_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."cart" ADD CONSTRAINT "cart_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "products"."product_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product" ADD CONSTRAINT "product_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "products"."brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "products"."category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product" ADD CONSTRAINT "product_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "products"."model"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product" ADD CONSTRAINT "product_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "products"."gender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_images" ADD CONSTRAINT "product_images_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "products"."product_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_case_material_id_fkey" FOREIGN KEY ("case_material_id") REFERENCES "products"."material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_bracelet_material_id_fkey" FOREIGN KEY ("bracelet_material_id") REFERENCES "products"."material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_bracelet_color_id_fkey" FOREIGN KEY ("bracelet_color_id") REFERENCES "products"."color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "products"."color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "products"."currency_exchange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_dial_color_id_fkey" FOREIGN KEY ("dial_color_id") REFERENCES "products"."color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "products"."movement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "products"."size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_tax_rule_id_fkey" FOREIGN KEY ("tax_rule_id") REFERENCES "products"."tax_rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "products"."gender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_crystal_id_fkey" FOREIGN KEY ("crystal_id") REFERENCES "products"."crystal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_availability_id_fkey" FOREIGN KEY ("availability_id") REFERENCES "products"."availability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "products"."country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_items" ADD CONSTRAINT "product_items_complication_id_fkey" FOREIGN KEY ("complication_id") REFERENCES "products"."complications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."ownership_proof" ADD CONSTRAINT "ownership_proof_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."ownership_proof" ADD CONSTRAINT "ownership_proof_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "products"."product_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."sign_of_wear" ADD CONSTRAINT "sign_of_wear_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."sign_of_wear" ADD CONSTRAINT "sign_of_wear_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "products"."product_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_analytics" ADD CONSTRAINT "product_analytics_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"."product_analytics" ADD CONSTRAINT "product_analytics_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "products"."product_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
