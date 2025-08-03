-- AlterTable
ALTER TABLE "seller_profile_detail" ADD COLUMN     "location_from" VARCHAR(1000),
ALTER COLUMN "is_private" SET DEFAULT true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;
