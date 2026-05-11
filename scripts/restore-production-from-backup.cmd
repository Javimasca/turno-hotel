@echo off
setlocal EnableExtensions

echo.
echo ============================================================
echo  Restaurar PRODUCCION desde un backup .dump
echo ============================================================
echo.
echo Esto reemplazara la base de PRODUCCION con el backup elegido.
echo Antes se creara un backup del estado actual de produccion.
echo.

set "PG_DUMP=pg_dump"
set "PG_RESTORE=pg_restore"
set "PSQL=psql"

where "%PG_DUMP%" >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" (
    set "PG_DUMP=C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
  ) else if exist "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" (
    set "PG_DUMP=C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
  ) else if exist "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" (
    set "PG_DUMP=C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
  ) else if exist "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" (
    set "PG_DUMP=C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
  ) else (
    echo ERROR: No encuentro pg_dump.
    pause
    exit /b 1
  )
)

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

echo Backups disponibles:
dir /b backup-production-before-local-*.dump
echo.

set /p "BACKUP_FILE=Nombre exacto del backup a restaurar: "
if not exist "%BACKUP_FILE%" (
  echo ERROR: No existe el archivo "%BACKUP_FILE%".
  pause
  exit /b 1
)

echo.
echo Pega la URL de PRODUCCION de Vercel.
set /p "PROD_DATABASE_URL=PROD_DATABASE_URL: "
if /i "%PROD_DATABASE_URL:~0,13%"=="DATABASE_URL=" set "PROD_DATABASE_URL=%PROD_DATABASE_URL:~13%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:"=%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:?schema=public&=?%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:?schema=public=%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:&schema=public=%"
if "%PROD_DATABASE_URL:~-1%"=="?" set "PROD_DATABASE_URL=%PROD_DATABASE_URL:~0,-1%"
if "%PROD_DATABASE_URL:~-1%"=="&" set "PROD_DATABASE_URL=%PROD_DATABASE_URL:~0,-1%"

if "%PROD_DATABASE_URL:~0,8%"=="postgres" goto url_ok
echo ERROR: La URL no parece PostgreSQL.
pause
exit /b 1

:url_ok
echo.
echo Para confirmar, escribe exactamente: RESTAURAR PRODUCCION
set /p "CONFIRM=Confirmacion: "
if not "%CONFIRM%"=="RESTAURAR PRODUCCION" (
  echo Cancelado. No se ha tocado produccion.
  pause
  exit /b 1
)

set "STAMP=%date:~-4%%date:~3,2%%date:~0,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
set "STAMP=%STAMP: =0%"
set "CURRENT_BACKUP=backup-production-current-before-restore-%STAMP%.dump"

echo.
echo 1/3 Creando backup del estado actual de produccion...
"%PG_DUMP%" "%PROD_DATABASE_URL%" --format=custom --no-owner --no-privileges --file="%CURRENT_BACKUP%"
if errorlevel 1 (
  echo ERROR creando backup actual. No continuo.
  pause
  exit /b 1
)

echo.
echo 2/3 Vaciando esquema public de produccion...
"%PSQL%" "%PROD_DATABASE_URL%" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE;" -c "CREATE SCHEMA public;"
if errorlevel 1 (
  echo ERROR vaciando produccion.
  echo Backup actual: %CURRENT_BACKUP%
  pause
  exit /b 1
)

echo.
echo 3/3 Restaurando %BACKUP_FILE%...
"%PG_RESTORE%" --exit-on-error --no-owner --no-privileges --dbname="%PROD_DATABASE_URL%" "%BACKUP_FILE%"
if errorlevel 1 (
  echo ERROR restaurando backup.
  echo Backup actual previo a este intento: %CURRENT_BACKUP%
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  Produccion restaurada correctamente.
echo ============================================================
echo Backup actual previo a restaurar: %CURRENT_BACKUP%
echo.
pause
