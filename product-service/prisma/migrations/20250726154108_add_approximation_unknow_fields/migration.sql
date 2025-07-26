-- AlterTable
ALTER TABLE "product" ADD COLUMN     "approximation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "buyer_confidence_boost_description" VARCHAR(5000),
ADD COLUMN     "unknown" BOOLEAN NOT NULL DEFAULT false;
