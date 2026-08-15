@echo off
setlocal
cd /d "%~dp0"
title Reset Tijvorya
if not exist package.json (
  echo ERROR: package.json not found.
  pause
  exit /b 1
)
taskkill /F /IM node.exe >nul 2>&1
if exist node_modules rmdir /S /Q node_modules
if exist .next rmdir /S /Q .next
call npm.cmd config set registry https://registry.npmjs.org/
call npm.cmd cache verify
call npm.cmd install
if errorlevel 1 (
  echo Installation failed.
  pause
  exit /b 1
)
echo Reset completed. Run START_TIJVORYA.bat
pause
