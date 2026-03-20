-- AlterTable
ALTER TABLE "JobCategory" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quadrantGroupId" TEXT,
ADD COLUMN     "shortName" TEXT,
ADD COLUMN     "textColor" TEXT;

-- AlterTable
ALTER TABLE "ShiftTemplate" ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "shortName" TEXT;

-- CreateTable
CREATE TABLE "QuadrantGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuadrantGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuadrantGroup_code_key" ON "QuadrantGroup"("code");

-- CreateIndex
CREATE INDEX "QuadrantGroup_isActive_idx" ON "QuadrantGroup"("isActive");

-- CreateIndex
CREATE INDEX "QuadrantGroup_displayOrder_idx" ON "QuadrantGroup"("displayOrder");

-- CreateIndex
CREATE INDEX "QuadrantGroup_name_idx" ON "QuadrantGroup"("name");

-- CreateIndex
CREATE INDEX "JobCategory_displayOrder_idx" ON "JobCategory"("displayOrder");

-- CreateIndex
CREATE INDEX "JobCategory_quadrantGroupId_idx" ON "JobCategory"("quadrantGroupId");

-- AddForeignKey
ALTER TABLE "JobCategory" ADD CONSTRAINT "JobCategory_quadrantGroupId_fkey" FOREIGN KEY ("quadrantGroupId") REFERENCES "QuadrantGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
