/*
  Warnings:

  - You are about to drop the column `coverImageId` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `tagId` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `imageId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `imageId` on the `productBrand` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,colorId,position]` on the table `ProductImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,key]` on the table `ProductSpecification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `altText` to the `BlogPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `BlogPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storageKey` to the `BlogPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `altText` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storageKey` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Made the column `productId` on table `ProductSpecification` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `altText` to the `productBrand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `productBrand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storageKey` to the `productBrand` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BlogPost" DROP CONSTRAINT "BlogPost_coverImageId_fkey";

-- DropForeignKey
ALTER TABLE "BlogPost" DROP CONSTRAINT "BlogPost_tagId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_imageId_fkey";

-- DropForeignKey
ALTER TABLE "ProductSpecification" DROP CONSTRAINT "ProductSpecification_productId_fkey";

-- DropForeignKey
ALTER TABLE "productBrand" DROP CONSTRAINT "productBrand_imageId_fkey";

-- DropIndex
DROP INDEX "BlogPost_tagId_idx";

-- DropIndex
DROP INDEX "ProductImage_productId_position_key";

-- DropIndex
DROP INDEX "ProductSpecification_productId_key";

-- AlterTable
ALTER TABLE "BlogPost" DROP COLUMN "coverImageId",
DROP COLUMN "tagId",
ADD COLUMN     "altText" TEXT NOT NULL,
ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "storageKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "imageId",
ADD COLUMN     "altText" TEXT NOT NULL,
ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "storageKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductSpecification" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "productId" SET NOT NULL;

-- AlterTable
ALTER TABLE "productBrand" DROP COLUMN "imageId",
ADD COLUMN     "altText" TEXT NOT NULL,
ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "storageKey" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "_BlogPostToBlogTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BlogPostToBlogTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BlogPostToBlogTag_B_index" ON "_BlogPostToBlogTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_productId_colorId_position_key" ON "ProductImage"("productId", "colorId", "position");

-- CreateIndex
CREATE INDEX "ProductSpecification_productId_idx" ON "ProductSpecification"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSpecification_productId_key_key" ON "ProductSpecification"("productId", "key");

-- AddForeignKey
ALTER TABLE "ProductSpecification" ADD CONSTRAINT "ProductSpecification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPostToBlogTag" ADD CONSTRAINT "_BlogPostToBlogTag_A_fkey" FOREIGN KEY ("A") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPostToBlogTag" ADD CONSTRAINT "_BlogPostToBlogTag_B_fkey" FOREIGN KEY ("B") REFERENCES "BlogTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
