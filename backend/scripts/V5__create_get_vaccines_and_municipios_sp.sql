-- V5: Create or Update Stored Procedures for Vaccines and Municipalities

-- This script ensures the stored procedures are up-to-date.

-- 1. Stored Procedure to get all vaccines
IF OBJECT_ID('usp_GetVaccines', 'P') IS NOT NULL
    DROP PROCEDURE usp_GetVaccines;
GO

CREATE PROCEDURE usp_GetVaccines
AS
BEGIN
    SET NOCOUNT ON;
    -- Corrected table name from Vacunas to Vacuna
    SELECT id_Vacuna, Nombre FROM Vacuna ORDER BY Nombre;
END
GO

-- 2. Stored Procedure to get municipalities by province
IF OBJECT_ID('usp_GetMunicipiosByProvincia', 'P') IS NOT NULL
    DROP PROCEDURE usp_GetMunicipiosByProvincia;
GO

CREATE PROCEDURE usp_GetMunicipiosByProvincia
    @id_Provincia INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_Municipio, Nombre
    FROM Municipio
    WHERE id_Provincia = @id_Provincia
    ORDER BY Nombre;
END
GO

PRINT 'V5 migration complete: usp_GetVaccines and usp_GetMunicipiosByProvincia created/updated.';
GO
