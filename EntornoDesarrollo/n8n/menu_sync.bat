@echo off
title n8n Sync Tool

:menu
cls

echo =========================================
echo   n8n Synchronizer (Docker + Git)
echo =========================================
echo.
echo [1] PUSH: Exportar de n8n
echo [2] PULL: Importar a n8n desde JSON locales
echo [3] PUBLISH: Republicar workflows en n8n
echo [4] FIX CREDENTIALS: Reparar IDs de credenciales localmente
echo [5] PURGE ARCHIVED: Eliminar flujos archivados de n8n (IRREVERSIBLE)
echo [0] Salir
echo.

set /p choice="Elige una opcion: "

if "%choice%"=="1" (
    powershell -ExecutionPolicy Bypass -File "%~dp0sync.ps1" -Action push
) else if "%choice%"=="2" (
    powershell -ExecutionPolicy Bypass -File "%~dp0sync.ps1" -Action pull
) else if "%choice%"=="3" (
    powershell -ExecutionPolicy Bypass -File "%~dp0sync.ps1" -Action publish
) else if "%choice%"=="4" (
    powershell -ExecutionPolicy Bypass -File "%~dp0fix_credentials.ps1") else if "%choice%"=="5" (
    powershell -ExecutionPolicy Bypass -File "%~dp0sync.ps1" -Action purge-archived) else if "%choice%"=="0" (
    exit /b 0
) else (
    echo Opcion no valida.
)

echo.
pause
goto :menu