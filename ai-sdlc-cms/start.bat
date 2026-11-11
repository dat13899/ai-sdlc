@echo off
REM ===== AI-SDLC CMS - start (idempotent: port 3300 dang listen thi thoat) =====
set "DIR=%~dp0"
set "LOG=%DIR%server.log"

netstat -ano | findstr ":3300" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
  echo [%date% %time%] AI-SDLC CMS da chay - thoat. >> "%LOG%"
  exit /b 0
)

cd /d "%DIR%"
REM chua build giao dien thi build truoc (lan dau / sau khi xoa web\dist)
if not exist "web\dist\index.html" (
  echo [%date% %time%] Build giao dien web\ ... >> "%LOG%"
  call npm run build >> "%LOG%" 2>&1
)
echo [%date% %time%] Khoi dong AI-SDLC CMS (port 3300)... >> "%LOG%"
start "AI-SDLC CMS" /min cmd /c "node server.js >> "%LOG%" 2>&1"
exit /b 0
