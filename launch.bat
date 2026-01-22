@echo off
title XMLGen Launcher
echo ==========================================
echo       XMLGen - Auto-Update Launcher
echo ==========================================

echo [1/4] Checking for updates...
git pull
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Git pull failed. Continuing with local version...
)

echo.
echo [2/4] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm install failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/4] Building Core Package...
call npm run build --workspace=packages/core
if %ERRORLEVEL% NEQ 0 (
    echo Error: Core build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [4/4] Launching Application...
call npm run dev --workspace=packages/app

pause
