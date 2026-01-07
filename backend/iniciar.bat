@echo off
echo ========================================
echo Iniciando Backend API - Sistema de Vacunacion
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando archivo .env...
if not exist ".env" (
    echo.
    echo ⚠️ ADVERTENCIA: No se encontro el archivo .env
    echo Por favor, crea el archivo .env con la configuracion de tu base de datos
    echo Ver .env.example para referencia
    echo.
    pause
    exit /b 1
)

echo Iniciando servidor API en puerto 3001...
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

call npm start

pause
