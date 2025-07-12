/*
  Warnings:

  - A unique constraint covering the columns `[email,user_type]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_email_key";

-- DropIndex
DROP INDEX "users_name_user_type_unique";

-- CreateIndex
CREATE UNIQUE INDEX "users_email_user_type_unique" ON "users"("email", "user_type");
