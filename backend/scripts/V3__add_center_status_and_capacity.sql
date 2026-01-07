-- V3: Add Center Status and Capacity
-- This script creates a new table for center statuses and adds capacity and status columns to the vaccination center table.

-- 1. Create the new table for center statuses
CREATE TABLE EstadosCentro (
    id_Estado INT PRIMARY KEY IDENTITY(1,1),
    NombreEstado NVARCHAR(50) NOT NULL UNIQUE
);
GO

-- 2. Populate the status table with initial values
INSERT INTO EstadosCentro (NombreEstado) VALUES ('Activo'), ('Inactivo'), ('Mantenimiento');
GO

-- 3. Add Capacidad and id_Estado columns to the CentroVacunacion table
ALTER TABLE CentroVacunacion
ADD Capacidad INT NOT NULL DEFAULT 200,
    id_Estado INT NOT NULL DEFAULT 1;
GO

-- 4. Add foreign key constraint to link CentroVacunacion to EstadosCentro
ALTER TABLE CentroVacunacion
ADD CONSTRAINT FK_CentroVacunacion_Estado FOREIGN KEY (id_Estado) REFERENCES EstadosCentro(id_Estado);
GO

-- 5. Update existing records to set the default values (optional, but good practice)
UPDATE CentroVacunacion
SET Capacidad = 200,
    id_Estado = (SELECT id_Estado FROM EstadosCentro WHERE NombreEstado = 'Activo')
WHERE id_Estado IS NULL OR Capacidad IS NULL;
GO

PRINT 'Database schema updated successfully. V3 migration complete.';
GO
