-- Migration 006: Many-to-Many relationship between Medics and Vaccination Centers
PRINT 'Executing Migration 006: Medico Centers Relationship...';
GO

-- 1. Create the Junction Table
IF OBJECT_ID('dbo.UsuarioCentro', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UsuarioCentro (
        id_Usuario INT NOT NULL,
        id_Centro INT NOT NULL,
        FechaAsignacion DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_UsuarioCentro PRIMARY KEY (id_Usuario, id_Centro),
        CONSTRAINT FK_UsuarioCentro_Usuario FOREIGN KEY (id_Usuario) REFERENCES dbo.Usuario(id_Usuario) ON DELETE CASCADE,
        CONSTRAINT FK_UsuarioCentro_Centro FOREIGN KEY (id_Centro) REFERENCES dbo.CentroVacunacion(id_CentroVacunacion) ON DELETE CASCADE
    );
    PRINT 'Table UsuarioCentro created.';
END
GO

-- 2. Create the Table-Valued Parameter (TVP) Type
IF NOT EXISTS (SELECT 1 FROM sys.types WHERE name = 'MedicoCentrosType' AND is_table_type = 1)
BEGIN
    CREATE TYPE dbo.MedicoCentrosType AS TABLE (
        id_Centro INT
    );
    PRINT 'Type MedicoCentrosType created.';
END
GO

PRINT 'Migration 006 completed successfully.';
GO
