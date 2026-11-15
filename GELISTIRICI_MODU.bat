@echo off
title NotMusic (Gelistirici Modu - Vite Canli Duzenleme)
cd /d "%~dp0"
echo Gelistirici sunucusu baslatiliyor (Canli Hot-Reload)...
start "" http://localhost:3000
call npm.cmd run dev
pause
