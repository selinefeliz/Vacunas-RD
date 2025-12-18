-- Migration 004: Center Statuses (EstadosCentro)
PRINT 'Executing Migration 004: Center Statuses Schema...';
GO

-- 1. Create EstadosCentro Table
IF OBJECT_ID('dbo.EstadosCentro', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EstadosCentro (
        id_Estado INT IDENTITY(1,1) PRIMARY KEY,
        NombreEstado NVARCHAR(50) UNIQUE NOT NULL
    );
    PRINT 'Table EstadosCentro created.';
END
GO

-- 2. Populate Initial Statuses
IF NOT EXISTS (SELECT 1 FROM dbo.EstadosCentro)
BEGIN
    INSERT INTO dbo.EstadosCentro (NombreEstado) VALUES 
    ('Activo'),
    ('Mantenimiento'),
    ('Inactivo');
    PRINT 'Initial data inserted into EstadosCentro.';
END
GO

-- 3. Update CentroVacunacion FK
IF COL_LENGTH('dbo.CentroVacunacion', 'id_Estado') IS NOT NULL
BEGIN
    -- Ensure the relationship exists for data integrity
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CentroVacunacion_EstadosCentro')
    BEGIN
        ALTER TABLE dbo.CentroVacunacion
        ADD CONSTRAINT FK_CentroVacunacion_EstadosCentro FOREIGN KEY (id_Estado) REFERENCES dbo.EstadosCentro(id_Estado);
        PRINT 'FK constraint added to CentroVacunacion.';
    END
END
GO

PRINT 'Migration 004 completed successfully.';
GO
