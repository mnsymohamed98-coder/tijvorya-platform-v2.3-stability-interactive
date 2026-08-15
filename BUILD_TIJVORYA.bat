@echo off
setlocal
cd /d "%~dp0"
title Build Tijvorya
if not exist package.json (
  echo ERROR: package.json not found.
  pause
  exit /b 1
)
if not exist node_modules call npm.cmd install
call npm.cmd run typecheck
if errorlevel 1 goto failed
call npm.cmd run lint
if errorlevel 1 goto failed
call npm.cmd run build
if errorlevel 1 goto failed
echo Production build completed successfully.
pause
exit /b 0
:failed
echo Build failed. Review the error above.
pause
exit /b 1
