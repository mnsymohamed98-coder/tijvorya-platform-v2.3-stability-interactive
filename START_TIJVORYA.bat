@echo off
setlocal
cd /d "%~dp0"
title Tijvorya Launcher v1.3.0

echo ========================================
echo        TIJVORYA PLATFORM v1.3.0
echo ========================================

echo Project folder: %CD%
if not exist package.json (
  echo ERROR: package.json is not in this folder.
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  pause
  exit /b 1
)

call npm.cmd config set registry https://registry.npmjs.org/ >nul
call npm.cmd config delete proxy >nul 2>&1
call npm.cmd config delete https-proxy >nul 2>&1

if not exist .env.local copy /Y .env.example .env.local >nul
if exist .next rmdir /S /Q .next

if not exist node_modules (
  echo Installing packages from registry.npmjs.org...
  call npm.cmd install --registry=https://registry.npmjs.org/
  if errorlevel 1 (
    echo Installation failed. Run FIX_NPM_REGISTRY.bat.
    pause
    exit /b 1
  )
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /F /PID %%P >nul 2>&1

start "Tijvorya Dev Server" /D "%~dp0" cmd /k npm.cmd run dev -- -p 3000

echo Waiting for Tijvorya on port 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; 1..120 | %% { try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:3000/ar; if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){$ok=$true; break} } catch {}; Start-Sleep -Seconds 1 }; if($ok){exit 0}else{exit 1}"
if errorlevel 1 (
  echo The server did not start. Read the error in the Tijvorya Dev Server window.
  pause
  exit /b 1
)

start "" "http://localhost:3000/ar"
echo Tijvorya is running at http://localhost:3000/ar
pause
