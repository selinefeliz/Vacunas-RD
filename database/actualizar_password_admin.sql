-- ========================================
-- ACTUALIZAR CONTRASEÑA DEL ADMINISTRADOR
-- Sistema de Gestión de Vacunación
-- ========================================

-- Contraseña: Admin123
-- Hash bcrypt generado correctamente

USE SistemaVacunacionDB;
GO

-- Actualizar la contraseña del administrador
UPDATE Usuario 
SET Clave = '$2b$10$laeC5zE7BqnwCBf.AFlPkeQBjLLPHghSBg.BAVjckGhmcxAt8rCPe' 
WHERE Email = 'admin@sistema.com';
GO

-- Verificar que se actualizó
SELECT 
    id_Usuario,
    Email,
    Cedula_Usuario,
    'Admin123' AS Contraseña_Correcta
FROM Usuario 
WHERE Email = 'admin@sistema.com';
GO

PRINT '';
PRINT '========================================';
PRINT 'CONTRASEÑA ACTUALIZADA';
PRINT '========================================';
PRINT 'Email: admin@sistema.com';
PRINT 'Contraseña: Admin123';
PRINT '========================================';
PRINT '';
GO
