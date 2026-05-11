@echo off
setlocal EnableExtensions

echo.
echo ============================================================
echo  Reparar tabla de maestros de turnos en LOCAL
echo ============================================================
echo.
echo Esto crea shift_masters si no existe.
echo No borra empleados, turnos ni otros datos.
echo.

set "PSQL=psql"
where "%PSQL%" >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\PostgreSQL\18\bin\psql.exe" (
    set "PSQL=C:\Program Files\PostgreSQL\18\bin\psql.exe"
  ) else if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" (
    set "PSQL=C:\Program Files\PostgreSQL\17\bin\psql.exe"
  ) else if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    set "PSQL=C:\Program Files\PostgreSQL\16\bin\psql.exe"
  ) else if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    set "PSQL=C:\Program Files\PostgreSQL\15\bin\psql.exe"
  ) else (
    echo ERROR: No encuentro psql.
    pause
    exit /b 1
  )
)

echo Pega la URL LOCAL.
echo Ejemplo: postgresql://postgres:PASSWORD@localhost:5432/TurnoHotel
set /p "LOCAL_DATABASE_URL=LOCAL_DATABASE_URL: "
if /i "%LOCAL_DATABASE_URL:~0,13%"=="DATABASE_URL=" set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:~13%"
set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:"=%"
set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:?schema=public=%"
set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:&schema=public=%"
if "%LOCAL_DATABASE_URL:~-1%"=="?" set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:~0,-1%"
if "%LOCAL_DATABASE_URL:~-1%"=="&" set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:~0,-1%"

if "%LOCAL_DATABASE_URL:~0,8%"=="postgres" goto url_ok
echo ERROR: LOCAL_DATABASE_URL no parece PostgreSQL.
pause
exit /b 1

:url_ok
"%PSQL%" "%LOCAL_DATABASE_URL%" -v ON_ERROR_STOP=1 ^
  -c "DO $$ BEGIN CREATE TYPE ""ShiftMasterType"" AS ENUM ('GENERAL', 'RESTAURANTE', 'PISOS'); EXCEPTION WHEN duplicate_object THEN null; END $$;" ^
  -c "CREATE TABLE IF NOT EXISTS ""shift_masters"" (""id"" TEXT NOT NULL, ""code"" TEXT NOT NULL, ""name"" TEXT NOT NULL, ""description"" TEXT, ""workplaceId"" TEXT NOT NULL, ""departmentId"" TEXT NOT NULL, ""workAreaId"" TEXT, ""jobCategoryId"" TEXT, ""type"" ""ShiftMasterType"" NOT NULL DEFAULT 'GENERAL', ""startMinute"" INTEGER NOT NULL, ""endMinute"" INTEGER NOT NULL, ""crossesMidnight"" BOOLEAN NOT NULL DEFAULT false, ""isPartial"" BOOLEAN NOT NULL DEFAULT false, ""backgroundColor"" TEXT, ""coversBreakfast"" BOOLEAN NOT NULL DEFAULT false, ""coversLunch"" BOOLEAN NOT NULL DEFAULT false, ""coversDinner"" BOOLEAN NOT NULL DEFAULT false, ""countsForRoomAssignment"" BOOLEAN NOT NULL DEFAULT false, ""isActive"" BOOLEAN NOT NULL DEFAULT true, ""createdAt"" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ""updatedAt"" TIMESTAMP(3) NOT NULL, CONSTRAINT ""shift_masters_pkey"" PRIMARY KEY (""id""));" ^
  -c "CREATE INDEX IF NOT EXISTS ""shift_masters_workplaceId_idx"" ON ""shift_masters""(""workplaceId"");" ^
  -c "CREATE INDEX IF NOT EXISTS ""shift_masters_departmentId_idx"" ON ""shift_masters""(""departmentId"");" ^
  -c "CREATE INDEX IF NOT EXISTS ""shift_masters_workAreaId_idx"" ON ""shift_masters""(""workAreaId"");" ^
  -c "CREATE INDEX IF NOT EXISTS ""shift_masters_jobCategoryId_idx"" ON ""shift_masters""(""jobCategoryId"");" ^
  -c "CREATE INDEX IF NOT EXISTS ""shift_masters_type_idx"" ON ""shift_masters""(""type"");" ^
  -c "CREATE INDEX IF NOT EXISTS ""shift_masters_isActive_idx"" ON ""shift_masters""(""isActive"");" ^
  -c "CREATE INDEX IF NOT EXISTS ""shift_masters_startMinute_endMinute_idx"" ON ""shift_masters""(""startMinute"", ""endMinute"");" ^
  -c "CREATE UNIQUE INDEX IF NOT EXISTS ""shift_masters_departmentId_code_key"" ON ""shift_masters""(""departmentId"", ""code"");" ^
  -c "CREATE UNIQUE INDEX IF NOT EXISTS ""shift_masters_departmentId_name_key"" ON ""shift_masters""(""departmentId"", ""name"");" ^
  -c "DO $$ BEGIN ALTER TABLE ""shift_masters"" ADD CONSTRAINT ""shift_masters_workplaceId_fkey"" FOREIGN KEY (""workplaceId"") REFERENCES ""workplaces""(""id"") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;" ^
  -c "DO $$ BEGIN ALTER TABLE ""shift_masters"" ADD CONSTRAINT ""shift_masters_departmentId_fkey"" FOREIGN KEY (""departmentId"") REFERENCES ""departments""(""id"") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;" ^
  -c "DO $$ BEGIN ALTER TABLE ""shift_masters"" ADD CONSTRAINT ""shift_masters_workAreaId_fkey"" FOREIGN KEY (""workAreaId"") REFERENCES ""work_areas""(""id"") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;" ^
  -c "DO $$ BEGIN ALTER TABLE ""shift_masters"" ADD CONSTRAINT ""shift_masters_jobCategoryId_fkey"" FOREIGN KEY (""jobCategoryId"") REFERENCES ""job_categories""(""id"") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;"

if errorlevel 1 (
  echo.
  echo ERROR reparando maestros de turnos.
  pause
  exit /b 1
)

echo.
echo Tabla shift_masters reparada correctamente.
echo.
pause
