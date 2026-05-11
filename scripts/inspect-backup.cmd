@echo off
setlocal EnableExtensions

echo.
echo ============================================================
echo  Inspeccionar backup .dump sin restaurar produccion
echo ============================================================
echo.

set "PG_RESTORE=pg_restore"
set "PSQL=psql"
set "CREATEDB=createdb"
set "DROPDB=dropdb"

where "%PG_RESTORE%" >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" (
    set "PG_RESTORE=C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"
  ) else if exist "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" (
    set "PG_RESTORE=C:\Program Files\PostgreSQL\17\bin\pg_restore.exe"
  ) else if exist "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe" (
    set "PG_RESTORE=C:\Program Files\PostgreSQL\16\bin\pg_restore.exe"
  ) else if exist "C:\Program Files\PostgreSQL\15\bin\pg_restore.exe" (
    set "PG_RESTORE=C:\Program Files\PostgreSQL\15\bin\pg_restore.exe"
  ) else (
    echo ERROR: No encuentro pg_restore.
    pause
    exit /b 1
  )
)

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

where "%CREATEDB%" >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\PostgreSQL\18\bin\createdb.exe" (
    set "CREATEDB=C:\Program Files\PostgreSQL\18\bin\createdb.exe"
  ) else if exist "C:\Program Files\PostgreSQL\17\bin\createdb.exe" (
    set "CREATEDB=C:\Program Files\PostgreSQL\17\bin\createdb.exe"
  ) else if exist "C:\Program Files\PostgreSQL\16\bin\createdb.exe" (
    set "CREATEDB=C:\Program Files\PostgreSQL\16\bin\createdb.exe"
  ) else if exist "C:\Program Files\PostgreSQL\15\bin\createdb.exe" (
    set "CREATEDB=C:\Program Files\PostgreSQL\15\bin\createdb.exe"
  ) else (
    echo ERROR: No encuentro createdb.
    pause
    exit /b 1
  )
)

where "%DROPDB%" >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\PostgreSQL\18\bin\dropdb.exe" (
    set "DROPDB=C:\Program Files\PostgreSQL\18\bin\dropdb.exe"
  ) else if exist "C:\Program Files\PostgreSQL\17\bin\dropdb.exe" (
    set "DROPDB=C:\Program Files\PostgreSQL\17\bin\dropdb.exe"
  ) else if exist "C:\Program Files\PostgreSQL\16\bin\dropdb.exe" (
    set "DROPDB=C:\Program Files\PostgreSQL\16\bin\dropdb.exe"
  ) else if exist "C:\Program Files\PostgreSQL\15\bin\dropdb.exe" (
    set "DROPDB=C:\Program Files\PostgreSQL\15\bin\dropdb.exe"
  ) else (
    echo ERROR: No encuentro dropdb.
    pause
    exit /b 1
  )
)

echo Backups locales disponibles:
dir /b backup-local-*.dump
echo.
echo Backups de produccion disponibles:
dir /b backup-production-before-local-*.dump
echo.

set /p "BACKUP_FILE=Nombre exacto del backup a inspeccionar: "
if not exist "%BACKUP_FILE%" (
  echo ERROR: No existe "%BACKUP_FILE%".
  pause
  exit /b 1
)

set /p "PGUSER_LOCAL=Usuario PostgreSQL local [postgres]: "
if "%PGUSER_LOCAL%"=="" set "PGUSER_LOCAL=postgres"
set /p "PGPASSWORD_LOCAL=Password PostgreSQL local: "
set "PGPASSWORD=%PGPASSWORD_LOCAL%"

set "INSPECT_DB=turnohotel_backup_inspect"

echo.
echo Preparando base temporal %INSPECT_DB%...
"%DROPDB%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" --if-exists "%INSPECT_DB%" >nul 2>nul
"%CREATEDB%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" "%INSPECT_DB%"
if errorlevel 1 (
  echo ERROR creando base temporal.
  set "PGPASSWORD="
  pause
  exit /b 1
)

echo.
echo Restaurando backup en base temporal...
"%PG_RESTORE%" --exit-on-error --no-owner --no-privileges --dbname="postgresql://%PGUSER_LOCAL%:%PGPASSWORD_LOCAL%@localhost:5432/%INSPECT_DB%" "%BACKUP_FILE%"
if errorlevel 1 (
  echo ERROR restaurando backup en base temporal.
  echo Intento limpiar base temporal...
  "%DROPDB%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" --if-exists "%INSPECT_DB%" >nul 2>nul
  set "PGPASSWORD="
  pause
  exit /b 1
)

echo.
echo Conteos:
"%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d "%INSPECT_DB%" -c "SELECT COUNT(*) AS employees FROM employees;" 2>nul
"%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d "%INSPECT_DB%" -c "SELECT COUNT(*) AS shifts FROM shifts;" 2>nul
"%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d "%INSPECT_DB%" -c "SELECT COUNT(*) AS workplaces FROM workplaces;" 2>nul
"%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d "%INSPECT_DB%" -c "SELECT COUNT(*) AS departments FROM departments;" 2>nul
"%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d "%INSPECT_DB%" -c "SELECT COUNT(*) AS shift_masters FROM shift_masters;" 2>nul
"%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d "%INSPECT_DB%" -c "SELECT COUNT(*) AS users FROM ""User"";" 2>nul

echo.
echo Base temporal creada: %INSPECT_DB%
echo Si este backup es el bueno, podemos restaurarlo a produccion o a una base local nueva.
echo.
set "PGPASSWORD="
pause
