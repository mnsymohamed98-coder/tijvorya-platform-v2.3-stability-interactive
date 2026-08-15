@echo off
setlocal
cd /d "%~dp0"
title Fix Tijvorya npm Registry

echo Fixing npm registry settings...
call npm.cmd config set registry https://registry.npmjs.org/
call npm.cmd config delete proxy >nul 2>&1
call npm.cmd config delete https-proxy >nul 2>&1

echo Stopping Node processes...
taskkill /F /IM node.exe >nul 2>&1

echo Removing incomplete installation...
if exist node_modules rmdir /S /Q node_modules
if exist .next rmdir /S /Q .next

echo Verifying registry...
call npm.cmd config get registry

echo Installing from the public npm registry...
call npm.cmd install --registry=https://registry.npmjs.org/
if errorlevel 1 (
  echo.
  echo Installation failed. Verify internet access to registry.npmjs.org on port 443.
  pause
  exit /b 1
)

echo.
echo Installation completed successfully.
echo Run START_TIJVORYA.bat
pause
