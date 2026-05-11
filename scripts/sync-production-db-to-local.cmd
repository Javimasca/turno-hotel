@echo off
setlocal EnableExtensions

echo.
echo ============================================================
echo  Copiar base de datos PRODUCCION a LOCAL
echo ============================================================
echo.
echo ATENCION: esto reemplazara los datos de LOCAL por los de PRODUCCION.
echo Antes se creara una copia de seguridad de local en esta carpeta.
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

set "STAMP=%date:~-4%%date:~3,2%%date:~0,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
set "STAMP=%STAMP: =0%"
set "LOCAL_BACKUP=backup-local-before-production-%STAMP%.dump"
set "PROD_BACKUP=backup-production-for-local-%STAMP%.dump"

echo Pega la URL de PRODUCCION de Vercel.
set /p "PROD_DATABASE_URL=PROD_DATABASE_URL: "
if /i "%PROD_DATABASE_URL:~0,13%"=="DATABASE_URL=" set "PROD_DATABASE_URL=%PROD_DATABASE_URL:~13%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:"=%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:?schema=public&=?%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:?schema=public=%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:&schema=public=%"
if "%PROD_DATABASE_URL:~-1%"=="?" set "PROD_DATABASE_URL=%PROD_DATABASE_URL:~0,-1%"
if "%PROD_DATABASE_URL:~-1%"=="&" set "PROD_DATABASE_URL=%PROD_DATABASE_URL:~0,-1%"
echo.

echo Pega la URL de la base LOCAL que quieres sobrescribir.
echo Ejemplo: postgresql://postgres:PASSWORD@localhost:5432/TurnoHotel
set /p "LOCAL_DATABASE_URL=LOCAL_DATABASE_URL: "
if /i "%LOCAL_DATABASE_URL:~0,13%"=="DATABASE_URL=" set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:~13%"
set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:"=%"
set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:?schema=public&=?%"
set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:?schema=public=%"
set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:&schema=public=%"
if "%LOCAL_DATABASE_URL:~-1%"=="?" set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:~0,-1%"
if "%LOCAL_DATABASE_URL:~-1%"=="&" set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:~0,-1%"
echo.

if "%PROD_DATABASE_URL:~0,8%"=="postgres" goto prod_ok
echo ERROR: PROD_DATABASE_URL no parece PostgreSQL.
pause
exit /b 1

:prod_ok
if "%LOCAL_DATABASE_URL:~0,8%"=="postgres" goto local_ok
echo ERROR: LOCAL_DATABASE_URL no parece PostgreSQL.
pause
exit /b 1

:local_ok
echo Para confirmar, escribe exactamente: SOBRESCRIBIR LOCAL
set /p "CONFIRM=Confirmacion: "
if not "%CONFIRM%"=="SOBRESCRIBIR LOCAL" (
  echo Cancelado. No se ha tocado local.
  pause
  exit /b 1
)

echo.
echo 1/4 Creando copia de seguridad de LOCAL...
"%PG_DUMP%" "%LOCAL_DATABASE_URL%" --format=custom --no-owner --no-privileges --file="%LOCAL_BACKUP%"
if errorlevel 1 (
  echo ERROR creando backup local. No continuo.
  pause
  exit /b 1
)

echo.
echo 2/4 Creando copia de seguridad de PRODUCCION...
"%PG_DUMP%" "%PROD_DATABASE_URL%" --format=custom --no-owner --no-privileges --file="%PROD_BACKUP%"
if errorlevel 1 (
  echo ERROR creando backup produccion. No se ha restaurado local.
  pause
  exit /b 1
)

echo.
echo 3/4 Vaciando esquema public de LOCAL...
"%PSQL%" "%LOCAL_DATABASE_URL%" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE;" -c "CREATE SCHEMA public;"
if errorlevel 1 (
  echo ERROR vaciando local.
  echo Backup local: %LOCAL_BACKUP%
  pause
  exit /b 1
)

echo.
echo 4/4 Restaurando PRODUCCION sobre LOCAL...
"%PG_RESTORE%" --exit-on-error --no-owner --no-privileges --dbname="%LOCAL_DATABASE_URL%" "%PROD_BACKUP%"
if errorlevel 1 (
  echo ERROR restaurando produccion en local.
  echo Backup local: %LOCAL_BACKUP%
  echo Backup produccion usado: %PROD_BACKUP%
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  Local actualizado correctamente con datos de produccion.
echo ============================================================
echo Backup local anterior: %LOCAL_BACKUP%
echo Backup produccion usado: %PROD_BACKUP%
echo.
pause
