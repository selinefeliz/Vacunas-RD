-- Script para crear usuario SQL Server para la API
-- Ejecutar en SQL Server Management Studio

USE master;
GO

-- Habilitar autenticación mixta (SQL Server y Windows)
EXEC xp_instance_regwrite 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer',
    N'LoginMode', 
    REG_DWORD, 
    2;
GO

-- Crear login SQL Server
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'vaccine_api')
BEGIN
    CREATE LOGIN vaccine_api WITH PASSWORD = 'VaccineAPI2024!';
    PRINT '✓ Login vaccine_api creado';
END
ELSE
BEGIN
    PRINT '✓ Login vaccine_api ya existe';
END
GO

-- Dar permisos en la base de datos
USE SistemaVacunacionDB;
GO

-- Crear usuario en la base de datos
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'vaccine_api')
BEGIN
    CREATE USER vaccine_api FOR LOGIN vaccine_api;
    PRINT '✓ Usuario vaccine_api creado en SistemaVacunacionDB';
END
ELSE
BEGIN
    PRINT '✓ Usuario vaccine_api ya existe en SistemaVacunacionDB';
END
GO

-- Dar permisos de db_owner (acceso completo)
ALTER ROLE db_owner ADD MEMBER vaccine_api;
GO

PRINT '';
PRINT '========================================';
PRINT 'CONFIGURACIÓN COMPLETADA';
PRINT '========================================';
PRINT 'Usuario: vaccine_api';
PRINT 'Contraseña: VaccineAPI2024!';
PRINT '========================================';
PRINT '';
PRINT 'IMPORTANTE: Reinicia SQL Server para aplicar el modo de autenticación mixta';
PRINT 'Comando: Restart-Service -Name MSSQLSERVER -Force';
PRINT '';
GO
