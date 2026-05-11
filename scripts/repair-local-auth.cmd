@echo off
setlocal EnableExtensions

echo.
echo ============================================================
echo  Reparar tablas de autenticacion en LOCAL
echo ============================================================
echo.
echo Esto elimina y recrea solo User y Session en LOCAL.
echo No toca empleados, turnos, centros ni departamentos.
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
echo.
echo Para confirmar, escribe exactamente: REPARAR AUTH LOCAL
set /p "CONFIRM=Confirmacion: "
if not "%CONFIRM%"=="REPARAR AUTH LOCAL" (
  echo Cancelado.
  pause
  exit /b 1
)

"%PSQL%" "%LOCAL_DATABASE_URL%" -v ON_ERROR_STOP=1 ^
  -c "DROP TABLE IF EXISTS ""Session"" CASCADE;" ^
  -c "DROP TABLE IF EXISTS ""User"" CASCADE;" ^
  -f "prisma\migrations\20260506112000_add_auth_tables\migration.sql"

if errorlevel 1 (
  echo.
  echo ERROR reparando auth local.
  pause
  exit /b 1
)

echo.
echo Auth local reparado. Ahora ejecuta:
echo scripts\create-local-admin.cmd
echo.
pause
