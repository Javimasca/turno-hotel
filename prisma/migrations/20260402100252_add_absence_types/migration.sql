-- CreateEnum
CREATE TYPE "AbsenceDurationMode" AS ENUM ('FULL_DAY', 'HOURLY', 'BOTH');

-- CreateEnum
CREATE TYPE "AbsenceLegalCategory" AS ENUM ('SICK_LEAVE', 'VACATION', 'PERSONAL', 'MEDICAL', 'UNPAID', 'OTHER');

-- CreateTable
CREATE TABLE "AbsenceType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "durationMode" "AbsenceDurationMode" NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "blocksShifts" BOOLEAN NOT NULL DEFAULT true,
    "countsAsWorkedTime" BOOLEAN NOT NULL DEFAULT false,
    "requiresDocument" BOOLEAN NOT NULL DEFAULT false,
    "allowsNotes" BOOLEAN NOT NULL DEFAULT true,
    "affectsPayroll" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "icon" TEXT,
    "legalCategory" "AbsenceLegalCategory",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbsenceType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbsenceType_code_key" ON "AbsenceType"("code");

-- CreateIndex
CREATE INDEX "AbsenceType_isActive_idx" ON "AbsenceType"("isActive");

-- CreateIndex
CREATE INDEX "AbsenceType_displayOrder_idx" ON "AbsenceType"("displayOrder");
