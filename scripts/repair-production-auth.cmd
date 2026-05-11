@echo off
setlocal EnableExtensions

echo.
echo ============================================================
echo  Reparar tablas de autenticacion en PRODUCCION
echo ============================================================
echo.
echo Este script crea User y Session si no existen.
echo Pega la URL de PRODUCCION de Vercel.
echo Puede ser la linea completa DATABASE_URL="..." o solo la URL.
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
    echo Instala PostgreSQL / PostgreSQL command line tools y vuelve a intentarlo.
    echo.
    pause
    exit /b 1
  )
)

set /p "PROD_DATABASE_URL=PROD_DATABASE_URL: "
if /i "%PROD_DATABASE_URL:~0,13%"=="DATABASE_URL=" set "PROD_DATABASE_URL=%PROD_DATABASE_URL:~13%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:"=%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:?schema=public&=?%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:?schema=public=%"
set "PROD_DATABASE_URL=%PROD_DATABASE_URL:&schema=public=%"
if "%PROD_DATABASE_URL:~-1%"=="?" set "PROD_DATABASE_URL=%PROD_DATABASE_URL:~0,-1%"
if "%PROD_DATABASE_URL:~-1%"=="&" set "PROD_DATABASE_URL=%PROD_DATABASE_URL:~0,-1%"

if "%PROD_DATABASE_URL:~0,8%"=="postgres" goto url_ok
echo.
echo ERROR: La URL no parece PostgreSQL. Debe empezar por postgres:// o postgresql://
pause
exit /b 1

:url_ok
"%PSQL%" "%PROD_DATABASE_URL%" -v ON_ERROR_STOP=1 -f "prisma\migrations\20260506112000_add_auth_tables\migration.sql"
if errorlevel 1 (
  echo.
  echo ERROR reparando tablas de autenticacion.
  pause
  exit /b 1
)

echo.
echo Tablas de autenticacion reparadas. Ahora puedes ejecutar:
echo scripts\create-production-admin.cmd
echo.
pause
