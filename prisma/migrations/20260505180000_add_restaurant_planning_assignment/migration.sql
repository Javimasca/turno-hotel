-- CreateEnum
CREATE TYPE "EmployeeWorkAreaLevel" AS ENUM ('TRAINING', 'STANDARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "AvailabilityBlockType" AS ENUM ('DAY_OFF', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "RestaurantCoverageRule" ALTER COLUMN "validTo" DROP NOT NULL;

-- CreateTable
CREATE TABLE "work_area_positions" (
    "id" TEXT NOT NULL,
    "workAreaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_area_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_work_areas" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workAreaId" TEXT NOT NULL,
    "level" "EmployeeWorkAreaLevel" NOT NULL DEFAULT 'STANDARD',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canLead" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_work_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_shift_proposals" (
    "id" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "workAreaId" TEXT,
    "shiftMasterId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "service" "RestaurantServiceType" NOT NULL,
    "requiredStaff" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_shift_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAvailabilityBlock" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "type" "AvailabilityBlockType" NOT NULL DEFAULT 'UNAVAILABLE',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeAvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_area_positions_workAreaId_code_key" ON "work_area_positions"("workAreaId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "work_area_positions_workAreaId_name_key" ON "work_area_positions"("workAreaId", "name");

-- CreateIndex
CREATE INDEX "work_area_positions_workAreaId_displayOrder_idx" ON "work_area_positions"("workAreaId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "employee_work_areas_employeeId_workAreaId_validFrom_key" ON "employee_work_areas"("employeeId", "workAreaId", "validFrom");

-- CreateIndex
CREATE INDEX "employee_work_areas_employeeId_idx" ON "employee_work_areas"("employeeId");

-- CreateIndex
CREATE INDEX "employee_work_areas_workAreaId_idx" ON "employee_work_areas"("workAreaId");

-- CreateIndex
CREATE INDEX "employee_work_areas_employeeId_isActive_validTo_idx" ON "employee_work_areas"("employeeId", "isActive", "validTo");

-- CreateIndex
CREATE INDEX "employee_work_areas_workAreaId_isActive_validTo_idx" ON "employee_work_areas"("workAreaId", "isActive", "validTo");

-- CreateIndex
CREATE INDEX "restaurant_shift_proposals_workplaceId_idx" ON "restaurant_shift_proposals"("workplaceId");

-- CreateIndex
CREATE INDEX "restaurant_shift_proposals_departmentId_idx" ON "restaurant_shift_proposals"("departmentId");

-- CreateIndex
CREATE INDEX "restaurant_shift_proposals_workAreaId_idx" ON "restaurant_shift_proposals"("workAreaId");

-- CreateIndex
CREATE INDEX "restaurant_shift_proposals_shiftMasterId_idx" ON "restaurant_shift_proposals"("shiftMasterId");

-- CreateIndex
CREATE INDEX "restaurant_shift_proposals_date_idx" ON "restaurant_shift_proposals"("date");

-- CreateIndex
CREATE INDEX "restaurant_shift_proposals_workplaceId_departmentId_date_idx" ON "restaurant_shift_proposals"("workplaceId", "departmentId", "date");

-- CreateIndex
CREATE INDEX "EmployeeAvailabilityBlock_employeeId_date_idx" ON "EmployeeAvailabilityBlock"("employeeId", "date");

-- CreateIndex
CREATE INDEX "EmployeeAvailabilityBlock_date_idx" ON "EmployeeAvailabilityBlock"("date");

-- AddForeignKey
ALTER TABLE "work_area_positions" ADD CONSTRAINT "work_area_positions_workAreaId_fkey" FOREIGN KEY ("workAreaId") REFERENCES "work_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_work_areas" ADD CONSTRAINT "employee_work_areas_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_work_areas" ADD CONSTRAINT "employee_work_areas_workAreaId_fkey" FOREIGN KEY ("workAreaId") REFERENCES "work_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_shift_proposals" ADD CONSTRAINT "restaurant_shift_proposals_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_shift_proposals" ADD CONSTRAINT "restaurant_shift_proposals_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_shift_proposals" ADD CONSTRAINT "restaurant_shift_proposals_workAreaId_fkey" FOREIGN KEY ("workAreaId") REFERENCES "work_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_shift_proposals" ADD CONSTRAINT "restaurant_shift_proposals_shiftMasterId_fkey" FOREIGN KEY ("shiftMasterId") REFERENCES "shift_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAvailabilityBlock" ADD CONSTRAINT "EmployeeAvailabilityBlock_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
