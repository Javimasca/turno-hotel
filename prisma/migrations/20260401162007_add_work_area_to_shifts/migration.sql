-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "workAreaId" TEXT;

-- AlterTable
ALTER TABLE "shift_masters" ADD COLUMN     "workAreaId" TEXT;

-- CreateIndex
CREATE INDEX "Shift_workAreaId_idx" ON "Shift"("workAreaId");

-- CreateIndex
CREATE INDEX "shift_masters_workAreaId_idx" ON "shift_masters"("workAreaId");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_workAreaId_fkey" FOREIGN KEY ("workAreaId") REFERENCES "work_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_masters" ADD CONSTRAINT "shift_masters_workAreaId_fkey" FOREIGN KEY ("workAreaId") REFERENCES "work_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
