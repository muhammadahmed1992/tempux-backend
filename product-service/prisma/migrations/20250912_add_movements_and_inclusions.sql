-- Add inclusions and movements tables
CREATE TABLE "inclusions" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) UNIQUE NOT NULL,
  "description" VARCHAR(200) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  "deleted_at" TIMESTAMPTZ(6),
  "created_by" BIGINT NOT NULL,
  "updated_by" BIGINT,
  "deleted_by" BIGINT,
  "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE "movements" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(50) UNIQUE NOT NULL,
  "description" VARCHAR(200) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  "deleted_at" TIMESTAMPTZ(6),
  "created_by" BIGINT NOT NULL,
  "updated_by" BIGINT,
  "deleted_by" BIGINT,
  "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Add new columns to product_items
ALTER TABLE "product_items"
ADD COLUMN "movement_type_id" INTEGER REFERENCES "movements"(id),
ADD COLUMN "inclusion_id" INTEGER REFERENCES "inclusions"(id);

-- Update movement_id to be nullable since we're moving to movement_type_id
ALTER TABLE "product_items" ALTER COLUMN "movement_id" DROP NOT NULL;

-- Create indices for better performance
CREATE INDEX "idx_product_items_movement_type" ON "product_items"("movement_type_id");
CREATE INDEX "idx_product_items_inclusion" ON "product_items"("inclusion_id");
