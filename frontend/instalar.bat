@echo off
echo ========================================
echo Instalando dependencias del Frontend
echo ========================================
echo.

cd /d "%~dp0"

echo Instalando con --legacy-peer-deps para resolver conflictos de React 19...
echo.

call npm install --legacy-peer-deps

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✓ Instalacion completada exitosamente!
    echo ========================================
    echo.
    echo Ahora puedes ejecutar: npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo ✗ Error durante la instalacion
    echo ========================================
    echo.
    echo Intenta ejecutar manualmente:
    echo npm install --legacy-peer-deps
    echo.
)

pause
