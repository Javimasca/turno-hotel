/*
  Warnings:

  - You are about to drop the `shifts` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('BORRADOR', 'PUBLICADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ShiftMasterType" AS ENUM ('GENERAL', 'RESTAURANTE', 'PISOS');

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_shiftTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_workAreaId_fkey";

-- DropTable
DROP TABLE "shifts";

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "jobCategoryId" TEXT,
    "shiftMasterId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'BORRADOR',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_masters" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workplaceId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "type" "ShiftMasterType" NOT NULL DEFAULT 'GENERAL',
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "crossesMidnight" BOOLEAN NOT NULL DEFAULT false,
    "isPartial" BOOLEAN NOT NULL DEFAULT false,
    "backgroundColor" TEXT,
    "coversBreakfast" BOOLEAN NOT NULL DEFAULT false,
    "coversLunch" BOOLEAN NOT NULL DEFAULT false,
    "coversDinner" BOOLEAN NOT NULL DEFAULT false,
    "countsForRoomAssignment" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_masters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shift_shiftMasterId_idx" ON "Shift"("shiftMasterId");

-- CreateIndex
CREATE INDEX "shift_masters_workplaceId_idx" ON "shift_masters"("workplaceId");

-- CreateIndex
CREATE INDEX "shift_masters_departmentId_idx" ON "shift_masters"("departmentId");

-- CreateIndex
CREATE INDEX "shift_masters_type_idx" ON "shift_masters"("type");

-- CreateIndex
CREATE INDEX "shift_masters_isActive_idx" ON "shift_masters"("isActive");

-- CreateIndex
CREATE INDEX "shift_masters_startMinute_endMinute_idx" ON "shift_masters"("startMinute", "endMinute");

-- CreateIndex
CREATE UNIQUE INDEX "shift_masters_departmentId_code_key" ON "shift_masters"("departmentId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "shift_masters_departmentId_name_key" ON "shift_masters"("departmentId", "name");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_jobCategoryId_fkey" FOREIGN KEY ("jobCategoryId") REFERENCES "job_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_shiftMasterId_fkey" FOREIGN KEY ("shiftMasterId") REFERENCES "shift_masters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_masters" ADD CONSTRAINT "shift_masters_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_masters" ADD CONSTRAINT "shift_masters_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
