@echo off
setlocal EnableExtensions

echo.
echo ============================================================
echo  Crear/actualizar usuario ADMIN en PRODUCCION
echo ============================================================
echo.
echo Pega la URL de PRODUCCION de Vercel.
echo Puede ser la linea completa DATABASE_URL="..." o solo la URL.
echo.

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
set "DATABASE_URL=%PROD_DATABASE_URL%"
node scripts\create-admin-user.mjs
set "DATABASE_URL="

if errorlevel 1 (
  echo.
  echo ERROR creando admin.
  pause
  exit /b 1
)

echo.
pause
