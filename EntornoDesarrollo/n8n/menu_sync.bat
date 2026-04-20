@echo off
title n8n Sync Tool
cls

echo =========================================
echo   n8n Synchronizer (Docker + Git)
echo =========================================
echo.
echo [1] PUSH: Exportar de n8n
echo [2] PULL: Bajar de Git e importar a n8n
echo.

set /p choice="Elige una opcion (1 o 2): "

if "%choice%"=="1" (
    powershell -ExecutionPolicy Bypass -File "%~dp0sync.ps1" push
) else if "%choice%"=="2" (
    powershell -ExecutionPolicy Bypass -File "%~dp0sync.ps1" pull
) else (
    echo Opcion no valida.
)

echo.
pause