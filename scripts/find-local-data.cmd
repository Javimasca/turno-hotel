@echo off
setlocal EnableExtensions

echo.
echo ============================================================
echo  Buscar datos en bases PostgreSQL locales
echo ============================================================
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

set /p "PGUSER_LOCAL=Usuario PostgreSQL local [postgres]: "
if "%PGUSER_LOCAL%"=="" set "PGUSER_LOCAL=postgres"

set /p "PGPASSWORD_LOCAL=Password PostgreSQL local: "
set "PGPASSWORD=%PGPASSWORD_LOCAL%"

set "DB_LIST_FILE=%TEMP%\turnohotel-local-dbs.txt"
"%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d postgres -At -c "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;" > "%DB_LIST_FILE%"
if errorlevel 1 (
  echo.
  echo ERROR: no puedo listar bases locales. Revisa usuario/password/servicio PostgreSQL.
  del "%DB_LIST_FILE%" >nul 2>nul
  set "PGPASSWORD="
  pause
  exit /b 1
)

echo.
echo Bases encontradas y conteos si existen tablas de TurnoHotel:
echo.

for /f "usebackq delims=" %%D in ("%DB_LIST_FILE%") do (
  echo ------------------------------------------------------------
  echo Base: %%D
  "%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d "%%D" -At -c "SELECT 'employees=' || COUNT(*) FROM employees;" 2>nul
  "%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d "%%D" -At -c "SELECT 'shifts=' || COUNT(*) FROM shifts;" 2>nul
  "%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d "%%D" -At -c "SELECT 'workplaces=' || COUNT(*) FROM workplaces;" 2>nul
  "%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d "%%D" -At -c "SELECT 'departments=' || COUNT(*) FROM departments;" 2>nul
  "%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d "%%D" -At -c "SELECT 'shift_masters=' || COUNT(*) FROM shift_masters;" 2>nul
  "%PSQL%" -h localhost -p 5432 -U "%PGUSER_LOCAL%" -d "%%D" -At -c "SELECT 'ShiftMaster=' || COUNT(*) FROM ""ShiftMaster"";" 2>nul
)

del "%DB_LIST_FILE%" >nul 2>nul
set "PGPASSWORD="

echo.
echo Si una base muestra employees/shifts con registros, esa es la base local buena.
echo La URL sera:
echo postgresql://%PGUSER_LOCAL%:TU_PASSWORD@localhost:5432/NOMBRE_BASE
echo.
pause
