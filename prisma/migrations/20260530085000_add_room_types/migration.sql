CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stayoverCleaningMinutes" INTEGER NOT NULL,
    "departureCleaningMinutes" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "room_types_workplaceId_code_key" ON "room_types"("workplaceId", "code");
CREATE UNIQUE INDEX "room_types_workplaceId_name_key" ON "room_types"("workplaceId", "name");
CREATE INDEX "room_types_workplaceId_displayOrder_idx" ON "room_types"("workplaceId", "displayOrder");
CREATE INDEX "room_types_isActive_idx" ON "room_types"("isActive");

ALTER TABLE "room_types" ADD CONSTRAINT "room_types_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
