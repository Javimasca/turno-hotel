DO $$ BEGIN
    CREATE TYPE "WeeklyDaysOffMode" AS ENUM ('AUTO', 'FIXED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Weekday" AS ENUM (
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "employees"
ADD COLUMN IF NOT EXISTS "weeklyDaysOffMode" "WeeklyDaysOffMode" NOT NULL DEFAULT 'AUTO',
ADD COLUMN IF NOT EXISTS "fixedDayOff1" "Weekday",
ADD COLUMN IF NOT EXISTS "fixedDayOff2" "Weekday";

ALTER TABLE "restaurant_shift_proposals"
ADD COLUMN IF NOT EXISTS "covers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "ratioCoversPerEmployee" INTEGER;

DO $$ BEGIN
    CREATE TYPE "AvailabilityBlockSource" AS ENUM ('MANUAL', 'AUTO_PROPOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "EmployeeAvailabilityBlock"
ADD COLUMN IF NOT EXISTS "source" "AvailabilityBlockSource" NOT NULL DEFAULT 'MANUAL';
