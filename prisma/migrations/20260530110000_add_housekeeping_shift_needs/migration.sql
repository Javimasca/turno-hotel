CREATE TYPE "StaffingNeedStatus" AS ENUM ('DRAFT', 'READY', 'ASSIGNED');

CREATE TABLE "housekeeping_shift_needs" (
    "id" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "shiftMasterId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "requiredStaff" INTEGER NOT NULL,
    "assignedStaff" INTEGER NOT NULL DEFAULT 0,
    "requiredMinutes" INTEGER NOT NULL,
    "coveredMinutes" INTEGER NOT NULL,
    "status" "StaffingNeedStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housekeeping_shift_needs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "housekeeping_shift_needs_workplaceId_departmentId_shiftMasterId_date_key" ON "housekeeping_shift_needs"("workplaceId", "departmentId", "shiftMasterId", "date");
CREATE INDEX "housekeeping_shift_needs_workplaceId_departmentId_date_idx" ON "housekeeping_shift_needs"("workplaceId", "departmentId", "date");
CREATE INDEX "housekeeping_shift_needs_status_idx" ON "housekeeping_shift_needs"("status");

ALTER TABLE "housekeeping_shift_needs" ADD CONSTRAINT "housekeeping_shift_needs_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "housekeeping_shift_needs" ADD CONSTRAINT "housekeeping_shift_needs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "housekeeping_shift_needs" ADD CONSTRAINT "housekeeping_shift_needs_shiftMasterId_fkey" FOREIGN KEY ("shiftMasterId") REFERENCES "shift_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
