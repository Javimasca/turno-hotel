/*
  Warnings:

  - You are about to drop the column `quadrantGroupId` on the `department_job_categories` table. All the data in the column will be lost.
  - You are about to drop the column `workAreaId` on the `department_job_categories` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[departmentId,jobCategoryId]` on the table `department_job_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "department_job_categories" DROP CONSTRAINT "department_job_categories_quadrantGroupId_fkey";

-- DropForeignKey
ALTER TABLE "department_job_categories" DROP CONSTRAINT "department_job_categories_workAreaId_fkey";

-- DropIndex
DROP INDEX "department_job_categories_departmentId_jobCategoryId_workAr_key";

-- DropIndex
DROP INDEX "department_job_categories_quadrantGroupId_displayOrder_idx";

-- DropIndex
DROP INDEX "department_job_categories_workAreaId_displayOrder_idx";

-- AlterTable
ALTER TABLE "department_job_categories" DROP COLUMN "quadrantGroupId",
DROP COLUMN "workAreaId";

-- CreateIndex
CREATE UNIQUE INDEX "department_job_categories_departmentId_jobCategoryId_key" ON "department_job_categories"("departmentId", "jobCategoryId");
