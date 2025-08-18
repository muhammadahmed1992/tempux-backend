/*
  Warnings:

  - You are about to drop the column `name` on the `tags` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[title]` on the table `tags` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `tags` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "products"."tags_name_key";

-- AlterTable
ALTER TABLE "products"."tags" DROP COLUMN "name",
ADD COLUMN     "title" VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tags_title_key" ON "products"."tags"("title");
