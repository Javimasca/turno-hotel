@echo off
setlocal EnableExtensions

echo.
echo ============================================================
echo  Reparar tabla de ratios restaurante en LOCAL
echo ============================================================
echo.
echo Esto crea RestaurantCoverageRule si no existe.
echo No toca empleados, turnos, centros ni departamentos.
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
  -c "DO $$ BEGIN CREATE TYPE ""RestaurantServiceType"" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER'); EXCEPTION WHEN duplicate_object THEN null; END $$;" ^
  -c "CREATE TABLE IF NOT EXISTS ""RestaurantCoverageRule"" (""id"" TEXT NOT NULL, ""workplaceId"" TEXT NOT NULL, ""serviceType"" ""RestaurantServiceType"" NOT NULL, ""ratioCoversPerEmployee"" INTEGER NOT NULL, ""validFrom"" TIMESTAMP(3) NOT NULL, ""validTo"" TIMESTAMP(3), ""isActive"" BOOLEAN NOT NULL DEFAULT true, ""createdAt"" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ""updatedAt"" TIMESTAMP(3) NOT NULL, CONSTRAINT ""RestaurantCoverageRule_pkey"" PRIMARY KEY (""id""));" ^
  -c "CREATE INDEX IF NOT EXISTS ""RestaurantCoverageRule_workplaceId_serviceType_validFrom_validTo_idx"" ON ""RestaurantCoverageRule""(""workplaceId"", ""serviceType"", ""validFrom"", ""validTo"");" ^
  -c "DO $$ BEGIN ALTER TABLE ""RestaurantCoverageRule"" ADD CONSTRAINT ""RestaurantCoverageRule_workplaceId_fkey"" FOREIGN KEY (""workplaceId"") REFERENCES ""workplaces""(""id"") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;"

if errorlevel 1 (
  echo.
  echo ERROR reparando tabla de ratios restaurante.
  pause
  exit /b 1
)

echo.
echo Tabla de ratios restaurante reparada correctamente.
echo.
pause
