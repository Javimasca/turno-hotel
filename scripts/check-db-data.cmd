@echo off
setlocal EnableExtensions

echo.
echo ============================================================
echo  Comprobar datos en una base PostgreSQL
echo ============================================================
echo.
echo Pega la URL de la base a comprobar.
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
    pause
    exit /b 1
  )
)

set /p "CHECK_DATABASE_URL=DATABASE_URL: "
if /i "%CHECK_DATABASE_URL:~0,13%"=="DATABASE_URL=" set "CHECK_DATABASE_URL=%CHECK_DATABASE_URL:~13%"
set "CHECK_DATABASE_URL=%CHECK_DATABASE_URL:"=%"
set "CHECK_DATABASE_URL=%CHECK_DATABASE_URL:?schema=public&=?%"
set "CHECK_DATABASE_URL=%CHECK_DATABASE_URL:?schema=public=%"
set "CHECK_DATABASE_URL=%CHECK_DATABASE_URL:&schema=public=%"
if "%CHECK_DATABASE_URL:~-1%"=="?" set "CHECK_DATABASE_URL=%CHECK_DATABASE_URL:~0,-1%"
if "%CHECK_DATABASE_URL:~-1%"=="&" set "CHECK_DATABASE_URL=%CHECK_DATABASE_URL:~0,-1%"

if "%CHECK_DATABASE_URL:~0,8%"=="postgres" goto url_ok
echo.
echo ERROR: La URL no parece PostgreSQL.
pause
exit /b 1

:url_ok
"%PSQL%" "%CHECK_DATABASE_URL%" -c "SELECT 'employees' AS tabla, COUNT(*) AS registros FROM employees;"
"%PSQL%" "%CHECK_DATABASE_URL%" -c "SELECT 'shifts' AS tabla, COUNT(*) AS registros FROM shifts;"
"%PSQL%" "%CHECK_DATABASE_URL%" -c "SELECT 'shift_masters' AS tabla, COUNT(*) AS registros FROM shift_masters;"
"%PSQL%" "%CHECK_DATABASE_URL%" -c "SELECT 'absences' AS tabla, COUNT(*) AS registros FROM ""Absence"";"
"%PSQL%" "%CHECK_DATABASE_URL%" -c "SELECT 'users' AS tabla, COUNT(*) AS registros FROM ""User"";"
"%PSQL%" "%CHECK_DATABASE_URL%" -c "SELECT 'workplaces' AS tabla, COUNT(*) AS registros FROM workplaces;"
"%PSQL%" "%CHECK_DATABASE_URL%" -c "SELECT 'departments' AS tabla, COUNT(*) AS registros FROM departments;"
"%PSQL%" "%CHECK_DATABASE_URL%" -c "SELECT 'work_areas' AS tabla, COUNT(*) AS registros FROM work_areas;"

echo.
pause
