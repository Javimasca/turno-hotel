-- CreateEnum
CREATE TYPE "AbsenceUnit" AS ENUM ('FULL_DAY', 'HOURLY');

-- CreateEnum
CREATE TYPE "AbsenceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "absenceTypeId" TEXT NOT NULL,
    "unit" "AbsenceUnit" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "startMinutes" INTEGER,
    "endMinutes" INTEGER,
    "status" "AbsenceStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Absence_employeeId_startDate_endDate_idx" ON "Absence"("employeeId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Absence_status_idx" ON "Absence"("status");

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_absenceTypeId_fkey" FOREIGN KEY ("absenceTypeId") REFERENCES "AbsenceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
