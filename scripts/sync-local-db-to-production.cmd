@echo off
setlocal EnableExtensions

echo.
echo ============================================================
echo  Copiar base de datos LOCAL a PRODUCCION
echo ============================================================
echo.
echo ATENCION: esto reemplazara los datos de PRODUCCION por los de LOCAL.
echo Antes se creara una copia de seguridad de produccion en esta carpeta.
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
    echo Instala PostgreSQL / PostgreSQL command line tools y vuelve a intentarlo.
    echo.
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
    echo Instala PostgreSQL / PostgreSQL command line tools y vuelve a intentarlo.
    echo.
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
    echo Instala PostgreSQL / PostgreSQL command line tools y vuelve a intentarlo.
    echo.
    pause
    exit /b 1
  )
)

set "STAMP=%date:~-4%%date:~3,2%%date:~0,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
set "STAMP=%STAMP: =0%"
set "PROD_BACKUP=backup-production-before-local-%STAMP%.dump"
set "LOCAL_BACKUP=backup-local-%STAMP%.dump"

echo Pega la URL de la base de datos LOCAL.
echo Debe empezar por postgresql:// o postgres://
set /p "LOCAL_DATABASE_URL=LOCAL_DATABASE_URL: "
if /i "%LOCAL_DATABASE_URL:~0,13%"=="DATABASE_URL=" set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:~13%"
set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:"=%"
set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:?schema=public&=?%"
set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:?schema=public=%"
set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:&schema=public=%"
if "%LOCAL_DATABASE_URL:~-1%"=="?" set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:~0,-1%"
if "%LOCAL_DATABASE_URL:~-1%"=="&" set "LOCAL_DATABASE_URL=%LOCAL_DATABASE_URL:~0,-1%"
echo.

echo Pega la URL de la base de datos de PRODUCCION.
echo Debe empezar por postgresql:// o postgres://
set /p "PROD_DATABASE_URL=PROD_DATABASE_URL: "
if /i "%PROD_DATABASE_URL:~0,13%"=="DATABASE_URL=" set "PROD_DATABASE_URL=%PROD_DATABASE_URL:~13%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:"=%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:?schema=public&=?%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:?schema=public=%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:&schema=public=%"
if "%PROD_DATABASE_URL:~-1%"=="?" set "PROD_DATABASE_URL=%PROD_DATABASE_URL:~0,-1%"
if "%PROD_DATABASE_URL:~-1%"=="&" set "PROD_DATABASE_URL=%PROD_DATABASE_URL:~0,-1%"
echo.

if "%LOCAL_DATABASE_URL:~0,8%"=="postgres" goto local_ok
echo ERROR: LOCAL_DATABASE_URL no parece una URL PostgreSQL.
pause
exit /b 1

:local_ok
if "%PROD_DATABASE_URL:~0,8%"=="postgres" goto prod_ok
echo ERROR: PROD_DATABASE_URL no parece una URL PostgreSQL.
pause
exit /b 1

:prod_ok
echo Para confirmar, escribe exactamente: SOBRESCRIBIR PRODUCCION
set /p "CONFIRM=Confirmacion: "
if not "%CONFIRM%"=="SOBRESCRIBIR PRODUCCION" (
  echo Cancelado. No se ha tocado produccion.
  pause
  exit /b 1
)

echo.
echo 1/3 Creando copia de seguridad de PRODUCCION...
"%PG_DUMP%" "%PROD_DATABASE_URL%" --format=custom --no-owner --no-privileges --file="%PROD_BACKUP%"
if errorlevel 1 (
  echo ERROR creando backup de produccion. No continuo.
  pause
  exit /b 1
)

echo.
echo 2/3 Creando copia de seguridad de LOCAL...
"%PG_DUMP%" "%LOCAL_DATABASE_URL%" --format=custom --no-owner --no-privileges --file="%LOCAL_BACKUP%"
if errorlevel 1 (
  echo ERROR creando backup local. No se ha restaurado nada en produccion.
  pause
  exit /b 1
)

echo.
echo 3/4 Vaciando esquema public de PRODUCCION...
"%PSQL%" "%PROD_DATABASE_URL%" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE;" -c "CREATE SCHEMA public;"
if errorlevel 1 (
  echo.
  echo ERROR vaciando el esquema public de produccion.
  echo Tienes backup de produccion en: %PROD_BACKUP%
  pause
  exit /b 1
)

echo.
echo 4/4 Restaurando LOCAL sobre PRODUCCION...
"%PG_RESTORE%" --exit-on-error --no-owner --no-privileges --dbname="%PROD_DATABASE_URL%" "%LOCAL_BACKUP%"
if errorlevel 1 (
  echo.
  echo ERROR restaurando en produccion.
  echo Tienes backup de produccion en: %PROD_BACKUP%
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  Terminado correctamente.
echo ============================================================
echo Backup de produccion: %PROD_BACKUP%
echo Backup local usado:   %LOCAL_BACKUP%
echo.
pause
