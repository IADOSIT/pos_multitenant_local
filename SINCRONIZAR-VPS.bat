@echo off
title POS-iaDoS — Sync VPS
powershell -ExecutionPolicy Bypass -File "%~dp0sincronizar-vps.ps1"
pause
