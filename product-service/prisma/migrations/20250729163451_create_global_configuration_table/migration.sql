/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `GlobalConfiguration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GlobalConfiguration_key_key" ON "GlobalConfiguration"("key");
