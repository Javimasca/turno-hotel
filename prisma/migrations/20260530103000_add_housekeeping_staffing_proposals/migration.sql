CREATE TABLE "housekeeping_staffing_proposals" (
    "id" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "shiftMasterId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "requiredMinutes" INTEGER NOT NULL,
    "shiftEffectiveMinutes" INTEGER NOT NULL,
    "requiredStaff" INTEGER NOT NULL,
    "coveredMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housekeeping_staffing_proposals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "housekeeping_staffing_proposals_workplaceId_departmentId_shiftMasterId_date_key" ON "housekeeping_staffing_proposals"("workplaceId", "departmentId", "shiftMasterId", "date");
CREATE INDEX "housekeeping_staffing_proposals_workplaceId_departmentId_date_idx" ON "housekeeping_staffing_proposals"("workplaceId", "departmentId", "date");
CREATE INDEX "housekeeping_staffing_proposals_shiftMasterId_idx" ON "housekeeping_staffing_proposals"("shiftMasterId");

ALTER TABLE "housekeeping_staffing_proposals" ADD CONSTRAINT "housekeeping_staffing_proposals_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "housekeeping_staffing_proposals" ADD CONSTRAINT "housekeeping_staffing_proposals_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "housekeeping_staffing_proposals" ADD CONSTRAINT "housekeeping_staffing_proposals_shiftMasterId_fkey" FOREIGN KEY ("shiftMasterId") REFERENCES "shift_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
