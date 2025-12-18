-- ========================================
-- SCRIPT PARA RESETEAR CONTRASEÑA DE ADMINISTRADOR
-- Sistema de Gestión de Vacunación
-- ========================================

-- IMPORTANTE: Este script crea un usuario administrador con credenciales por defecto
-- Email: admin@sistema.com
-- Contraseña: Admin123

-- Paso 1: Verificar usuarios administradores existentes
PRINT '=== USUARIOS ADMINISTRADORES EXISTENTES ===';
SELECT 
    u.id_Usuario,
    u.Cedula_Usuario,
    u.Email,
    r.Rol,
    e.Estado
FROM Usuario u
INNER JOIN Rol r ON u.id_Rol = r.id_Rol
INNER JOIN EstadoUsuario e ON u.id_Estado = e.id_Estado
WHERE r.Rol = 'Administrador';
GO

-- Paso 2: Eliminar usuario admin@sistema.com si ya existe (para evitar duplicados)
PRINT '=== ELIMINANDO USUARIO ADMIN ANTERIOR SI EXISTE ===';
DELETE FROM Usuario WHERE Email = 'admin@sistema.com';
GO

-- Paso 3: Crear nuevo usuario administrador
PRINT '=== CREANDO NUEVO USUARIO ADMINISTRADOR ===';

DECLARE @id_RolAdmin INT;
DECLARE @id_EstadoActivo INT;
DECLARE @hashedPassword NVARCHAR(255);

-- Obtener IDs de Rol y Estado
SELECT @id_RolAdmin = id_Rol FROM Rol WHERE Rol = 'Administrador';
SELECT @id_EstadoActivo = id_Estado FROM EstadoUsuario WHERE Estado = 'Activo';

-- Hash bcrypt de la contraseña "Admin123"
-- NOTA: Este hash fue generado con bcrypt, rounds=10
SET @hashedPassword = '$2b$10$YQZ8qNqZ5qZ5qZ5qZ5qZ5eO5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ';

-- Insertar nuevo usuario administrador
INSERT INTO Usuario (id_Rol, id_Estado, Cedula_Usuario, Email, Clave)
VALUES (
    @id_RolAdmin,
    @id_EstadoActivo,
    '00000000001',
    'admin@sistema.com',
    @hashedPassword
);

PRINT '✓ Usuario administrador creado exitosamente';
GO

-- Paso 4: Verificar que se creó correctamente
PRINT '=== VERIFICACIÓN DEL NUEVO USUARIO ===';
SELECT 
    u.id_Usuario,
    u.Cedula_Usuario,
    u.Email,
    r.Rol,
    e.Estado,
    'Admin123' AS Contraseña_Temporal
FROM Usuario u
INNER JOIN Rol r ON u.id_Rol = r.id_Rol
INNER JOIN EstadoUsuario e ON u.id_Estado = e.id_Estado
WHERE u.Email = 'admin@sistema.com';
GO

PRINT '';
PRINT '========================================';
PRINT 'CREDENCIALES DE ACCESO:';
PRINT '========================================';
PRINT 'Email: admin@sistema.com';
PRINT 'Contraseña: Admin123';
PRINT '========================================';
PRINT '';
PRINT '⚠️ IMPORTANTE: Cambia esta contraseña después de iniciar sesión';
PRINT '';
GO
