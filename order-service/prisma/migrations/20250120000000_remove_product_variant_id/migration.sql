-- Remove product_variant_id column from order_item table
ALTER TABLE "orders"."order_item" DROP COLUMN "product_variant_id";

-- Update the unique constraint to remove product_variant_id
DROP INDEX IF EXISTS "order_item_order_id_seller_id_product_Id_product_variant_id_key";
CREATE UNIQUE INDEX "order_item_order_id_seller_id_product_Id_key" ON "orders"."order_item"("order_id", "seller_id", "product_Id");

