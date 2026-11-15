@echo off
title NotMusic (Tarayici Modu)
echo Tarayici modu baslatiliyor: http://localhost:3001
cd /d "%~dp0"
start "" http://localhost:3001
call npm.cmd run server
pause
