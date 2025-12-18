@echo off
echo ========================================
echo Iniciando Frontend - Sistema de Vacunacion
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando archivo .env.local...
if not exist ".env.local" (
    echo.
    echo ⚠️ ADVERTENCIA: No se encontro el archivo .env.local
    echo Creando archivo .env.local con configuracion por defecto...
    echo NEXT_PUBLIC_API_URL=http://localhost:3001/api > .env.local
    echo ✓ Archivo .env.local creado
    echo.
)

echo Iniciando servidor de desarrollo en puerto 3003...
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

call npm run dev

pause
