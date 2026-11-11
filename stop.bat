@echo off
REM ==============================================================================
REM AI-SDLC Full Stack - Dung ca 2 sites (Port 3200 va 3300)
REM ==============================================================================
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==============================================================================
echo                 DUNG HE THONG AI-SDLC - 2 SITES
echo ==============================================================================
echo.

set "STOPPED_3200=0"
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3200" ^| findstr "LISTENING"') do (
  taskkill /f /pid %%a >nul 2>&1
  if !errorlevel!==0 (
    echo [x] Da dung ai.btdat.io.vn [Port 3200 - PID: %%a]
    set "STOPPED_3200=1"
  )
)
if "!STOPPED_3200!"=="0" (
  echo [-] ai.btdat.io.vn [Port 3200] khong chay.
)

set "STOPPED_3300=0"
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3300" ^| findstr "LISTENING"') do (
  taskkill /f /pid %%a >nul 2>&1
  if !errorlevel!==0 (
    echo [x] Da dung cms-ai.btdat.io.vn [Port 3300 - PID: %%a]
    set "STOPPED_3300=1"
  )
)
if "!STOPPED_3300!"=="0" (
  echo [-] cms-ai.btdat.io.vn [Port 3300] khong chay.
)

echo.
echo ==============================================================================
echo   DA HOAN TAT DUNG CAC DICH VU.
echo ==============================================================================
echo.
timeout /t 3 /nobreak >nul 2>&1
exit /b 0
