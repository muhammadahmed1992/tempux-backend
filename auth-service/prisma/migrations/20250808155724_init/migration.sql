-- CreateTable
CREATE TABLE "users"."role_access_management" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "access_management_id" BIGINT NOT NULL,
    "description" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "role_access_management_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."access_management" (
    "id" BIGSERIAL NOT NULL,
    "access" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "access_management_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."saved_searches" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "search_query" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."seller_profile_detail" (
    "id" BIGSERIAL NOT NULL,
    "brand_name" VARCHAR(50) NOT NULL,
    "brand_description" VARCHAR(100),
    "user_id" BIGINT NOT NULL,
    "vat_number" VARCHAR(15),
    "location_from" VARCHAR(1000),
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "seller_profile_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."seller_profile_rating" (
    "id" BIGSERIAL NOT NULL,
    "rating_name" VARCHAR(50) NOT NULL,
    "rating_value" DECIMAL(2,1),
    "seller_id" BIGINT,
    "reviewed_by" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "seller_profile_rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."roles" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."user_roles" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "full_name" VARCHAR(100),
    "password" VARCHAR(150) NOT NULL,
    "telephone" VARCHAR(15),
    "address" VARCHAR(150),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "otp" CHAR(60),
    "otp_expires_at" TIMESTAMPTZ(6),
    "otp_verified" BOOLEAN NOT NULL DEFAULT false,
    "googleId" VARCHAR(400),
    "facebookId" VARCHAR(400),
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "is_seller_approved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_access_management_role_id_access_management_id_key" ON "users"."role_access_management"("role_id", "access_management_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "users"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "users"."user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"."users"("email");

-- AddForeignKey
ALTER TABLE "users"."role_access_management" ADD CONSTRAINT "role_access_management_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "users"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users"."role_access_management" ADD CONSTRAINT "role_access_management_access_management_id_fkey" FOREIGN KEY ("access_management_id") REFERENCES "users"."access_management"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users"."saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users"."seller_profile_detail" ADD CONSTRAINT "seller_profile_detail_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users"."seller_profile_rating" ADD CONSTRAINT "seller_profile_rating_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users"."seller_profile_rating" ADD CONSTRAINT "seller_profile_rating_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "users"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
