/*
  Warnings:

  - You are about to drop the column `jobCategoryId` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `seniorityDate` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `weeklyHours` on the `employees` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('INDEFINIDO', 'TEMPORAL', 'FIJO_DISCONTINUO', 'FORMACION', 'PRACTICAS', 'INTERINIDAD', 'EVENTUAL', 'OTRO');

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_jobCategoryId_fkey";

-- DropIndex
DROP INDEX "employees_jobCategoryId_idx";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "jobCategoryId",
DROP COLUMN "seniorityDate",
DROP COLUMN "weeklyHours",
ADD COLUMN     "directManagerEmployeeId" TEXT;

-- CreateTable
CREATE TABLE "employee_contracts" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "jobCategoryId" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "seniorityDate" TIMESTAMP(3),
    "weeklyHours" DOUBLE PRECISION,
    "dailyHours" DOUBLE PRECISION,
    "employmentRate" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_contracts_employeeId_startDate_idx" ON "employee_contracts"("employeeId", "startDate");

-- CreateIndex
CREATE INDEX "employee_contracts_employeeId_endDate_idx" ON "employee_contracts"("employeeId", "endDate");

-- CreateIndex
CREATE INDEX "employee_contracts_jobCategoryId_idx" ON "employee_contracts"("jobCategoryId");

-- CreateIndex
CREATE INDEX "employee_contracts_contractType_idx" ON "employee_contracts"("contractType");

-- CreateIndex
CREATE INDEX "employees_directManagerEmployeeId_idx" ON "employees"("directManagerEmployeeId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_directManagerEmployeeId_fkey" FOREIGN KEY ("directManagerEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_jobCategoryId_fkey" FOREIGN KEY ("jobCategoryId") REFERENCES "job_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
