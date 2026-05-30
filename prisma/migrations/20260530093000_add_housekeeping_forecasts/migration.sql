CREATE TABLE "housekeeping_forecasts" (
    "id" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "stayovers" INTEGER NOT NULL DEFAULT 0,
    "departures" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housekeeping_forecasts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "housekeeping_forecasts_workplaceId_roomTypeId_date_key" ON "housekeeping_forecasts"("workplaceId", "roomTypeId", "date");
CREATE INDEX "housekeeping_forecasts_workplaceId_date_idx" ON "housekeeping_forecasts"("workplaceId", "date");
CREATE INDEX "housekeeping_forecasts_roomTypeId_idx" ON "housekeeping_forecasts"("roomTypeId");

ALTER TABLE "housekeeping_forecasts" ADD CONSTRAINT "housekeeping_forecasts_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "housekeeping_forecasts" ADD CONSTRAINT "housekeeping_forecasts_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
