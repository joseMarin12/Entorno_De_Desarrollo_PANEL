@echo off
title n8n Sync Tool

:menu
cls

echo =========================================
echo   n8n Synchronizer (Docker + Git)
echo =========================================
echo.
echo [1] PUSH: Exportar de n8n
echo [2] PULL: Bajar de Git e importar a n8n
echo [3] PUBLISH: Publicar todos los workflows en n8n
echo [0] Salir
echo.

set /p choice="Elige una opcion: "

if "%choice%"=="1" (
    powershell -ExecutionPolicy Bypass -File "%~dp0sync.ps1" push
) else if "%choice%"=="2" (
    powershell -ExecutionPolicy Bypass -File "%~dp0sync.ps1" pull
) else if "%choice%"=="3" (
    powershell -ExecutionPolicy Bypass -File "%~dp0sync.ps1" publish
) else if "%choice%"=="0" (
    exit /b 0
) else (
    echo Opcion no valida.
)

echo.
pause
goto :menu