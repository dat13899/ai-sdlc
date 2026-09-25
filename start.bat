@echo off
REM ===== AI-SDLC site - start (idempotent: port 3200 dang listen thi thoat) =====
set "DIR=C:\Users\datel\ai-sdlc"
set "NODE=C:\Program Files\nodejs\node.exe"
set "LOG=%DIR%\server.log"

netstat -ano | findstr ":3200" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
  echo [%date% %time%] AI-SDLC da chay - thoat. >> %LOG%
  exit /b 0
)

cd /d %DIR%
echo [%date% %time%] Khoi dong AI-SDLC (port 3200)... >> %LOG%
start "AI-SDLC" /min "%NODE%" server.js
exit /b 0
