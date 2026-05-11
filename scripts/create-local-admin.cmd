@echo off
setlocal EnableExtensions

echo.
echo ============================================================
echo  Crear/actualizar usuario ADMIN en LOCAL
echo ============================================================
echo.

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
set "DATABASE_URL=%LOCAL_DATABASE_URL%"
node scripts\create-admin-user.mjs
set "DATABASE_URL="

if errorlevel 1 (
  echo.
  echo ERROR creando admin local.
  pause
  exit /b 1
)

echo.
pause
