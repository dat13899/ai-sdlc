@echo off
REM ==============================================================================
REM AI-SDLC Full Stack - Khoi dong 2 sites:
REM   1. ai.btdat.io.vn     -> http://localhost:3200 (Quy trinh va Tai lieu Markdown)
REM   2. cms-ai.btdat.io.vn -> http://localhost:3300 (He thong CMS theo doi tien do)
REM
REM Co che: Idempotent - Neu port nao dang LISTEN thi bo qua, khong khoi dong trung.
REM Chay duoc o bat ky thu muc nao, tu dong xac dinh duong dan tuyet doi.
REM ==============================================================================
chcp 65001 >nul
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0"
set "CMS_DIR=%ROOT_DIR%ai-sdlc-cms\"
set "DOC_LOG=%ROOT_DIR%server.log"
set "CMS_LOG=%CMS_DIR%server.log"

echo ==============================================================================
echo                 KHOI DONG HE THONG AI-SDLC - 2 SITES
echo ==============================================================================
echo.

REM 1. Kiem tra Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo [LOI] Khong tim thay Node.js trong PATH!
  echo Vui long cai dat Node.js tai https://nodejs.org/ truoc khi chay.
  pause
  exit /b 1
)

REM 2. Khoi dong Site 1: ai.btdat.io.vn (Port 3200)
netstat -ano | findstr ":3200" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
  echo [OK] 1. ai.btdat.io.vn [Port 3200] dang hoat dong san.
  echo [%date% %time%] AI-SDLC Docs [port 3200] da chay - bo qua. >> "%DOC_LOG%"
) else (
  echo [>>] 1. Dang khoi dong ai.btdat.io.vn [Port 3200]...
  cd /d "%ROOT_DIR%"
  echo [%date% %time%] Khoi dong AI-SDLC Docs [port 3200]... >> "%DOC_LOG%"
  start "AI-SDLC-Docs" /min node server.js
  echo      - Da khoi chay ngam tren port 3200.
)

REM 3. Khoi dong Site 2: cms-ai.btdat.io.vn (Port 3300)
netstat -ano | findstr ":3300" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
  echo [OK] 2. cms-ai.btdat.io.vn [Port 3300] dang hoat dong san.
  echo [%date% %time%] AI-SDLC CMS [port 3300] da chay - bo qua. >> "%CMS_LOG%"
) else (
  REM Kiem tra neu chua build giao dien web thi build truoc
  if not exist "%CMS_DIR%web\dist\index.html" (
    echo [..] Chua co ban build web/dist, dang tien hanh build giao dien CMS...
    cd /d "%CMS_DIR%"
    call npm run build >> "%CMS_LOG%" 2>&1
  )
  echo [>>] 2. Dang khoi dong cms-ai.btdat.io.vn [Port 3300]...
  cd /d "%CMS_DIR%"
  echo [%date% %time%] Khoi dong AI-SDLC CMS [port 3300]... >> "%CMS_LOG%"
  start "AI-SDLC-CMS" /min node server.js
  echo      - Da khoi chay ngam tren port 3300.
)

echo.
echo ==============================================================================
echo   HE THONG SAN SANG PHUC VU:
echo   - Site 1 [Quy trinh va Docs]: http://localhost:3200  [ai.btdat.io.vn]
echo   - Site 2 [CMS Quan tri]:     http://localhost:3300  [cms-ai.btdat.io.vn]
echo ==============================================================================
echo.
timeout /t 3 /nobreak >nul 2>&1
exit /b 0
