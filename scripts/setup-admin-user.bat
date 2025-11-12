@echo off
REM Setup Admin User (Windows Batch Wrapper)
REM Handles dependency resolution for setup-admin-user.js
REM
REM Usage:
REM   scripts\setup-admin-user.bat
REM   scripts\setup-admin-user.bat --email=admin@example.com --password=secret123

setlocal enabledelayedexpansion

echo.
echo [94m🔧 SSO Admin User Setup[0m
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "SERVER_DIR=%PROJECT_ROOT%\server"

REM Check if server directory exists
if not exist "%SERVER_DIR%" (
  echo [91m❌ Error: server\ directory not found[0m
  exit /b 1
)

REM Check if server\.env exists
if not exist "%SERVER_DIR%\.env" (
  echo [91m❌ Error: server\.env not found[0m
  echo    Run: cd server ^&^& copy .env.example .env
  exit /b 1
)

REM Check if server\node_modules exists
if not exist "%SERVER_DIR%\node_modules" (
  echo [93m⚠️  server\node_modules not found[0m
  echo [94mℹ  Installing dependencies...[0m
  pushd "%SERVER_DIR%"
  call npm install
  popd
)

echo [94mℹ  Running admin setup script...[0m
echo.

REM Change to server directory and run the script
pushd "%SERVER_DIR%"
node scripts\setup-admin.js %*
set EXIT_CODE=%ERRORLEVEL%
popd

if %EXIT_CODE% neq 0 (
  echo.
  echo [93m⚠️  Script failed with exit code %EXIT_CODE%[0m
  echo [93m⚠️  Try SQL alternative: psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts\setup-admin-user.sql[0m
  exit /b %EXIT_CODE%
)

echo.
echo [92m✅ Setup complete![0m
echo.

endlocal
