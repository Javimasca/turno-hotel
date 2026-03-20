-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Workplace" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentJobCategory" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "jobCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentJobCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "crossesMidnight" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentShiftTemplate" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "shiftTemplateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentShiftTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "jobCategoryId" TEXT NOT NULL,
    "seniorityDate" DATE NOT NULL,
    "contractPartTimePercentage" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeWorkplace" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeWorkplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDepartment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "shiftTemplateId" TEXT NOT NULL,
    "shiftDate" DATE NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workplace_code_key" ON "Workplace"("code");

-- CreateIndex
CREATE INDEX "Workplace_isActive_idx" ON "Workplace"("isActive");

-- CreateIndex
CREATE INDEX "Workplace_name_idx" ON "Workplace"("name");

-- CreateIndex
CREATE INDEX "Department_workplaceId_idx" ON "Department"("workplaceId");

-- CreateIndex
CREATE INDEX "Department_workplaceId_isActive_idx" ON "Department"("workplaceId", "isActive");

-- CreateIndex
CREATE INDEX "Department_workplaceId_name_idx" ON "Department"("workplaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_workplaceId_code_key" ON "Department"("workplaceId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "JobCategory_code_key" ON "JobCategory"("code");

-- CreateIndex
CREATE INDEX "JobCategory_isActive_idx" ON "JobCategory"("isActive");

-- CreateIndex
CREATE INDEX "JobCategory_name_idx" ON "JobCategory"("name");

-- CreateIndex
CREATE INDEX "DepartmentJobCategory_departmentId_idx" ON "DepartmentJobCategory"("departmentId");

-- CreateIndex
CREATE INDEX "DepartmentJobCategory_jobCategoryId_idx" ON "DepartmentJobCategory"("jobCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentJobCategory_departmentId_jobCategoryId_key" ON "DepartmentJobCategory"("departmentId", "jobCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftTemplate_code_key" ON "ShiftTemplate"("code");

-- CreateIndex
CREATE INDEX "ShiftTemplate_isActive_idx" ON "ShiftTemplate"("isActive");

-- CreateIndex
CREATE INDEX "ShiftTemplate_name_idx" ON "ShiftTemplate"("name");

-- CreateIndex
CREATE INDEX "DepartmentShiftTemplate_departmentId_idx" ON "DepartmentShiftTemplate"("departmentId");

-- CreateIndex
CREATE INDEX "DepartmentShiftTemplate_shiftTemplateId_idx" ON "DepartmentShiftTemplate"("shiftTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentShiftTemplate_departmentId_shiftTemplateId_key" ON "DepartmentShiftTemplate"("departmentId", "shiftTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_code_key" ON "Employee"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_isActive_idx" ON "Employee"("isActive");

-- CreateIndex
CREATE INDEX "Employee_jobCategoryId_idx" ON "Employee"("jobCategoryId");

-- CreateIndex
CREATE INDEX "Employee_lastName_firstName_idx" ON "Employee"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Employee_seniorityDate_idx" ON "Employee"("seniorityDate");

-- CreateIndex
CREATE INDEX "EmployeeWorkplace_employeeId_idx" ON "EmployeeWorkplace"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeWorkplace_workplaceId_idx" ON "EmployeeWorkplace"("workplaceId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeWorkplace_employeeId_workplaceId_key" ON "EmployeeWorkplace"("employeeId", "workplaceId");

-- CreateIndex
CREATE INDEX "EmployeeDepartment_employeeId_idx" ON "EmployeeDepartment"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeDepartment_departmentId_idx" ON "EmployeeDepartment"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeDepartment_employeeId_departmentId_key" ON "EmployeeDepartment"("employeeId", "departmentId");

-- CreateIndex
CREATE INDEX "Shift_shiftDate_idx" ON "Shift"("shiftDate");

-- CreateIndex
CREATE INDEX "Shift_departmentId_shiftDate_idx" ON "Shift"("departmentId", "shiftDate");

-- CreateIndex
CREATE INDEX "Shift_employeeId_shiftDate_idx" ON "Shift"("employeeId", "shiftDate");

-- CreateIndex
CREATE INDEX "Shift_shiftTemplateId_shiftDate_idx" ON "Shift"("shiftTemplateId", "shiftDate");

-- CreateIndex
CREATE INDEX "Shift_status_shiftDate_idx" ON "Shift"("status", "shiftDate");

-- CreateIndex
CREATE INDEX "Shift_startsAt_endsAt_idx" ON "Shift"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_employeeId_shiftDate_key" ON "Shift"("employeeId", "shiftDate");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "Workplace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentJobCategory" ADD CONSTRAINT "DepartmentJobCategory_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentJobCategory" ADD CONSTRAINT "DepartmentJobCategory_jobCategoryId_fkey" FOREIGN KEY ("jobCategoryId") REFERENCES "JobCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentShiftTemplate" ADD CONSTRAINT "DepartmentShiftTemplate_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentShiftTemplate" ADD CONSTRAINT "DepartmentShiftTemplate_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "ShiftTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_jobCategoryId_fkey" FOREIGN KEY ("jobCategoryId") REFERENCES "JobCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeWorkplace" ADD CONSTRAINT "EmployeeWorkplace_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeWorkplace" ADD CONSTRAINT "EmployeeWorkplace_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "Workplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDepartment" ADD CONSTRAINT "EmployeeDepartment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDepartment" ADD CONSTRAINT "EmployeeDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "ShiftTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
