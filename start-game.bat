@echo off
REM Start map & static server and open the game in the default browser
SET "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo Starting map and file server...
REM Start the server in a new, minimized window. It will stay open.
start "Game Server" /min cmd /c "node "%SCRIPT_DIR%scripts\map_server.js""

echo Waiting for server to initialize...
REM Give the server a moment to start before opening the browser.
timeout /t 2 /nobreak >nul

echo Opening game in your default browser...
start "" "http://localhost:3000/3-Game_Index.html"

exit /b 0
