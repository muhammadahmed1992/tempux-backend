-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "order";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "payments";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "shipment";

-- CreateTable
CREATE TABLE "order"."order" (
    "id" BIGSERIAL NOT NULL,
    "buyer_id" BIGINT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "total_tax" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_commission" DECIMAL(10,2) NOT NULL,
    "total_shipping_cost" DECIMAL(10,2) NOT NULL,
    "order_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_status" VARCHAR(15) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order"."order_item" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "seller_id" BIGINT NOT NULL,
    "product_variant_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL,
    "order_item_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_status" VARCHAR(15) NOT NULL DEFAULT 'PENDING',
    "payout_status" VARCHAR(15) NOT NULL DEFAULT 'PENDING',
    "escrow_status" VARCHAR(15) NOT NULL DEFAULT 'HELD',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment"."shipment_provider" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(25) NOT NULL,
    "base_url" VARCHAR(100) NOT NULL,
    "shipment_tracking_url" VARCHAR(500) NOT NULL,
    "webhook_url" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "shipment_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment"."order_item_shipment" (
    "id" BIGSERIAL NOT NULL,
    "shipment_id" BIGINT NOT NULL,
    "order_item_id" BIGINT NOT NULL,
    "shipment_cost" DECIMAL(10,2) NOT NULL,
    "shipment_status" VARCHAR(20) NOT NULL,
    "tracking_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "order_item_shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment"."shipment_tracking" (
    "id" BIGSERIAL NOT NULL,
    "item_shipment_id" BIGINT NOT NULL,
    "shipment_status" VARCHAR(20) NOT NULL,
    "raw_api_response" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "shipment_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payment_method_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "payment_method_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payments" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "payment_method_type_id" INTEGER NOT NULL,
    "transaction_id" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency_id" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "payment_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gateway_response" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payouts" (
    "id" BIGSERIAL NOT NULL,
    "seller_id" BIGINT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency_id" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "payout_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transaction_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payout_item_links" (
    "id" BIGSERIAL NOT NULL,
    "payout_id" BIGINT NOT NULL,
    "order_item_id" BIGINT NOT NULL,
    "amount_released" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT,
    "deleted_by" BIGINT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "payout_item_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_item_order_id_seller_id_product_variant_id_key" ON "order"."order_item"("order_id", "seller_id", "product_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_provider_name_key" ON "shipment"."shipment_provider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_types_name_key" ON "payments"."payment_method_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_id_key" ON "payments"."payments"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_transaction_id_key" ON "payments"."payouts"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "payout_item_links_payout_id_order_item_id_key" ON "payments"."payout_item_links"("payout_id", "order_item_id");

-- AddForeignKey
ALTER TABLE "order"."order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"."order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment"."order_item_shipment" ADD CONSTRAINT "order_item_shipment_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipment"."shipment_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment"."shipment_tracking" ADD CONSTRAINT "shipment_tracking_item_shipment_id_fkey" FOREIGN KEY ("item_shipment_id") REFERENCES "shipment"."order_item_shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."payments" ADD CONSTRAINT "payments_payment_method_type_id_fkey" FOREIGN KEY ("payment_method_type_id") REFERENCES "payments"."payment_method_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."payout_item_links" ADD CONSTRAINT "payout_item_links_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payments"."payouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."payout_item_links" ADD CONSTRAINT "payout_item_links_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order"."order_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
