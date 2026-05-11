@echo off
setlocal EnableExtensions

cd /d "%~dp0\.."

echo.
echo Reiniciando entorno local de TurnoHotel...
echo.

taskkill /F /IM node.exe >nul 2>nul

if exist ".next" (
  rmdir /s /q ".next"
)

set "DATABASE_URL="

npm.cmd run dev
