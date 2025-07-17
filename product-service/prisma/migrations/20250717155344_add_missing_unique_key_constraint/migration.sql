/*
  Warnings:

  - A unique constraint covering the columns `[description]` on the table `tax_rule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tax_rule_description_key" ON "tax_rule"("description");
