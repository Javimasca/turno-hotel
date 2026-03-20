/*
  Warnings:

  - You are about to drop the `Department` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DepartmentJobCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DepartmentShiftTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Employee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmployeeDepartment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmployeeWorkplace` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuadrantGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Shift` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShiftTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Workplace` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_workplaceId_fkey";

-- DropForeignKey
ALTER TABLE "DepartmentJobCategory" DROP CONSTRAINT "DepartmentJobCategory_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "DepartmentJobCategory" DROP CONSTRAINT "DepartmentJobCategory_jobCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "DepartmentShiftTemplate" DROP CONSTRAINT "DepartmentShiftTemplate_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "DepartmentShiftTemplate" DROP CONSTRAINT "DepartmentShiftTemplate_shiftTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_jobCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeDepartment" DROP CONSTRAINT "EmployeeDepartment_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeDepartment" DROP CONSTRAINT "EmployeeDepartment_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeWorkplace" DROP CONSTRAINT "EmployeeWorkplace_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeWorkplace" DROP CONSTRAINT "EmployeeWorkplace_workplaceId_fkey";

-- DropForeignKey
ALTER TABLE "JobCategory" DROP CONSTRAINT "JobCategory_quadrantGroupId_fkey";

-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_shiftTemplateId_fkey";

-- DropTable
DROP TABLE "Department";

-- DropTable
DROP TABLE "DepartmentJobCategory";

-- DropTable
DROP TABLE "DepartmentShiftTemplate";

-- DropTable
DROP TABLE "Employee";

-- DropTable
DROP TABLE "EmployeeDepartment";

-- DropTable
DROP TABLE "EmployeeWorkplace";

-- DropTable
DROP TABLE "JobCategory";

-- DropTable
DROP TABLE "QuadrantGroup";

-- DropTable
DROP TABLE "Shift";

-- DropTable
DROP TABLE "ShiftTemplate";

-- DropTable
DROP TABLE "Workplace";

-- DropEnum
DROP TYPE "ShiftStatus";

-- CreateTable
CREATE TABLE "workplaces" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workplaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_areas" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quadrant_groups" (
    "id" TEXT NOT NULL,
    "workAreaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quadrant_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "textColor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_job_categories" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "jobCategoryId" TEXT NOT NULL,
    "workAreaId" TEXT NOT NULL,
    "quadrantGroupId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_job_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "crossesMidnight" BOOLEAN NOT NULL DEFAULT false,
    "backgroundColor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_shift_templates" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "shiftTemplateId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_shift_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "jobCategoryId" TEXT NOT NULL,
    "seniorityDate" TIMESTAMP(3),
    "weeklyHours" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_workplaces" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_workplaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_departments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "workAreaId" TEXT,
    "shiftTemplateId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workplaces_code_key" ON "workplaces"("code");

-- CreateIndex
CREATE INDEX "workplaces_name_idx" ON "workplaces"("name");

-- CreateIndex
CREATE INDEX "departments_workplaceId_idx" ON "departments"("workplaceId");

-- CreateIndex
CREATE INDEX "departments_name_idx" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_workplaceId_code_key" ON "departments"("workplaceId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_workplaceId_name_key" ON "departments"("workplaceId", "name");

-- CreateIndex
CREATE INDEX "work_areas_departmentId_displayOrder_idx" ON "work_areas"("departmentId", "displayOrder");

-- CreateIndex
CREATE INDEX "work_areas_name_idx" ON "work_areas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "work_areas_departmentId_code_key" ON "work_areas"("departmentId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "work_areas_departmentId_name_key" ON "work_areas"("departmentId", "name");

-- CreateIndex
CREATE INDEX "quadrant_groups_workAreaId_displayOrder_idx" ON "quadrant_groups"("workAreaId", "displayOrder");

-- CreateIndex
CREATE INDEX "quadrant_groups_name_idx" ON "quadrant_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "quadrant_groups_workAreaId_code_key" ON "quadrant_groups"("workAreaId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "quadrant_groups_workAreaId_name_key" ON "quadrant_groups"("workAreaId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "job_categories_code_key" ON "job_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "job_categories_name_key" ON "job_categories"("name");

-- CreateIndex
CREATE INDEX "job_categories_displayOrder_idx" ON "job_categories"("displayOrder");

-- CreateIndex
CREATE INDEX "job_categories_name_idx" ON "job_categories"("name");

-- CreateIndex
CREATE INDEX "department_job_categories_departmentId_displayOrder_idx" ON "department_job_categories"("departmentId", "displayOrder");

-- CreateIndex
CREATE INDEX "department_job_categories_jobCategoryId_idx" ON "department_job_categories"("jobCategoryId");

-- CreateIndex
CREATE INDEX "department_job_categories_workAreaId_displayOrder_idx" ON "department_job_categories"("workAreaId", "displayOrder");

-- CreateIndex
CREATE INDEX "department_job_categories_quadrantGroupId_displayOrder_idx" ON "department_job_categories"("quadrantGroupId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "department_job_categories_departmentId_jobCategoryId_workAr_key" ON "department_job_categories"("departmentId", "jobCategoryId", "workAreaId", "quadrantGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "shift_templates_code_key" ON "shift_templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "shift_templates_name_key" ON "shift_templates"("name");

-- CreateIndex
CREATE INDEX "shift_templates_name_idx" ON "shift_templates"("name");

-- CreateIndex
CREATE INDEX "department_shift_templates_departmentId_idx" ON "department_shift_templates"("departmentId");

-- CreateIndex
CREATE INDEX "department_shift_templates_shiftTemplateId_idx" ON "department_shift_templates"("shiftTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "department_shift_templates_departmentId_shiftTemplateId_key" ON "department_shift_templates"("departmentId", "shiftTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_code_key" ON "employees"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_lastName_firstName_idx" ON "employees"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "employees_jobCategoryId_idx" ON "employees"("jobCategoryId");

-- CreateIndex
CREATE INDEX "employee_workplaces_workplaceId_idx" ON "employee_workplaces"("workplaceId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_workplaces_employeeId_workplaceId_key" ON "employee_workplaces"("employeeId", "workplaceId");

-- CreateIndex
CREATE INDEX "employee_departments_departmentId_idx" ON "employee_departments"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_departments_employeeId_departmentId_key" ON "employee_departments"("employeeId", "departmentId");

-- CreateIndex
CREATE INDEX "shifts_departmentId_date_idx" ON "shifts"("departmentId", "date");

-- CreateIndex
CREATE INDEX "shifts_workAreaId_date_idx" ON "shifts"("workAreaId", "date");

-- CreateIndex
CREATE INDEX "shifts_shiftTemplateId_date_idx" ON "shifts"("shiftTemplateId", "date");

-- CreateIndex
CREATE INDEX "shifts_date_idx" ON "shifts"("date");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_employeeId_date_key" ON "shifts"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_areas" ADD CONSTRAINT "work_areas_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quadrant_groups" ADD CONSTRAINT "quadrant_groups_workAreaId_fkey" FOREIGN KEY ("workAreaId") REFERENCES "work_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_job_categories" ADD CONSTRAINT "department_job_categories_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_job_categories" ADD CONSTRAINT "department_job_categories_jobCategoryId_fkey" FOREIGN KEY ("jobCategoryId") REFERENCES "job_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_job_categories" ADD CONSTRAINT "department_job_categories_workAreaId_fkey" FOREIGN KEY ("workAreaId") REFERENCES "work_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_job_categories" ADD CONSTRAINT "department_job_categories_quadrantGroupId_fkey" FOREIGN KEY ("quadrantGroupId") REFERENCES "quadrant_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_shift_templates" ADD CONSTRAINT "department_shift_templates_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_shift_templates" ADD CONSTRAINT "department_shift_templates_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "shift_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_jobCategoryId_fkey" FOREIGN KEY ("jobCategoryId") REFERENCES "job_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_workplaces" ADD CONSTRAINT "employee_workplaces_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_workplaces" ADD CONSTRAINT "employee_workplaces_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_departments" ADD CONSTRAINT "employee_departments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_departments" ADD CONSTRAINT "employee_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_workAreaId_fkey" FOREIGN KEY ("workAreaId") REFERENCES "work_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "shift_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
