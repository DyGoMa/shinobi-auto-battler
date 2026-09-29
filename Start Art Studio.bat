@echo off
rem Double-click to open the art studio: starts the local server (tools/serve.mjs) and opens
rem http://localhost:8080/art.html in your browser. Close this window to stop the server.
title Art studio server (close this window to stop)
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install it from https://nodejs.org and try again.
  pause
  exit /b 1
)

rem Already running (another window)? Then just open the page.
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:8080/art.html) | Out-Null; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  echo The art studio server is already running. Opening the page...
  start "" "http://localhost:8080/art.html"
  timeout /t 3 >nul
  exit /b 0
)

rem Open the page a moment after the server starts.
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:8080/art.html'"
echo Starting the art studio at http://localhost:8080/art.html
echo Keep this window open while you work. Close it to stop the server.
echo.
node tools/serve.mjs
echo.
echo The server stopped.
pause
