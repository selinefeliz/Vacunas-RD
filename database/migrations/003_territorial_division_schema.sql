-- Migration 003: Territorial Division (Provinces and Municipalities)
PRINT 'Executing Migration 003: Territorial Division Schema...';
GO

-- 1. Create Provincia Table
IF OBJECT_ID('dbo.Provincia', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Provincia (
        id_Provincia INT IDENTITY(1,1) PRIMARY KEY,
        CodigoONE NVARCHAR(10) UNIQUE NOT NULL, -- Official code from ONE
        Nombre NVARCHAR(100) NOT NULL,
        id_Region INT NULL -- For future use if needed
    );
    PRINT 'Table Provincia created.';
END
GO

-- 2. Create Municipio Table
IF OBJECT_ID('dbo.Municipio', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Municipio (
        id_Municipio INT IDENTITY(1,1) PRIMARY KEY,
        id_Provincia INT NOT NULL,
        CodigoONE NVARCHAR(10) NOT NULL, -- Removed UNIQUE here
        Nombre NVARCHAR(100) NOT NULL,
        CONSTRAINT FK_Municipio_Provincia FOREIGN KEY (id_Provincia) REFERENCES dbo.Provincia(id_Provincia),
        CONSTRAINT UQ_Municipio_Provincia_Codigo UNIQUE (id_Provincia, CodigoONE) -- Added composite unique
    );
    PRINT 'Table Municipio created.';
END
GO

-- 3. Update CentroVacunacion constraints if needed
-- Assuming columns id_Provincia and id_Municipio already exist as NULL from previous schema
IF COL_LENGTH('dbo.CentroVacunacion', 'id_Provincia') IS NOT NULL
BEGIN
    -- Check if constraint already exists to avoid errors
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CentroVacunacion_Provincia')
    BEGIN
        ALTER TABLE dbo.CentroVacunacion
        ADD CONSTRAINT FK_CentroVacunacion_Provincia FOREIGN KEY (id_Provincia) REFERENCES dbo.Provincia(id_Provincia);
    END
END

IF COL_LENGTH('dbo.CentroVacunacion', 'id_Municipio') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CentroVacunacion_Municipio')
    BEGIN
        ALTER TABLE dbo.CentroVacunacion
        ADD CONSTRAINT FK_CentroVacunacion_Municipio FOREIGN KEY (id_Municipio) REFERENCES dbo.Municipio(id_Municipio);
    END
END
GO

PRINT 'Migration 003 completed successfully.';
GO
