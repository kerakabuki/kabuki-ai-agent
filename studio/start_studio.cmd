@echo off
rem Kabuki Navi Studio launcher: start server (safe if already running) + open browser
cd /d "%~dp0.."
start "Kabuki Navi Studio" /min node studio\server.mjs
timeout /t 2 /nobreak >nul
start http://127.0.0.1:3555
