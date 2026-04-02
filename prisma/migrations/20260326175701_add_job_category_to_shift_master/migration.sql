-- AlterTable
ALTER TABLE "shift_masters" ADD COLUMN     "jobCategoryId" TEXT;

-- CreateIndex
CREATE INDEX "shift_masters_jobCategoryId_idx" ON "shift_masters"("jobCategoryId");

-- AddForeignKey
ALTER TABLE "shift_masters" ADD CONSTRAINT "shift_masters_jobCategoryId_fkey" FOREIGN KEY ("jobCategoryId") REFERENCES "job_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
