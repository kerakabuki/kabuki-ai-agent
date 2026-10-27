@echo off
rem Kabuki Navi Studio launcher: start server (safe if already running) + open browser
rem Other episode: start_studio.cmd --config studio\episodes\chushingura_godanme.json
cd /d "%~dp0.."
start "Kabuki Navi Studio" /min node studio\server.mjs %*
timeout /t 2 /nobreak >nul
start http://127.0.0.1:3555
