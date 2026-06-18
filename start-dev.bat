@echo off
setlocal

cd /d "%~dp0"
title Moyun Academy Development Server

echo.
echo ========================================
echo   Moyun Academy - Development Server
echo ========================================
echo.

where node.exe >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not available in PATH.
  echo Please install Node.js and run this file again.
  echo.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm.cmd is not available in PATH.
  echo Please reinstall Node.js and run this file again.
  echo.
  pause
  exit /b 1
)

netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
  echo [INFO] Port 3000 is already in use.
  echo [INFO] Opening http://localhost:3000
  start "" "http://localhost:3000"
  exit /b 0
)

if not exist "node_modules\" (
  echo [INFO] Installing project dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
  )
  echo.
)

echo [INFO] Starting the website at http://localhost:3000
echo [INFO] Press Ctrl+C to stop the server.
echo.

start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'"
call npm.cmd run dev

if errorlevel 1 (
  echo.
  echo [ERROR] The development server stopped unexpectedly.
  pause
  exit /b 1
)

endlocal
