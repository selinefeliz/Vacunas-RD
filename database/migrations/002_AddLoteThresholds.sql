-- 1. Add Threshold columns to Lote table
IF COL_LENGTH('dbo.Lote', 'CantidadMinimaAlerta') IS NULL
BEGIN
    ALTER TABLE dbo.Lote
    ADD CantidadMinimaAlerta INT DEFAULT 10; -- Default threshold 10
END
GO

IF COL_LENGTH('dbo.Lote', 'CantidadMaximaCapacidad') IS NULL
BEGIN
    ALTER TABLE dbo.Lote
    ADD CantidadMaximaCapacidad INT NULL;
END
GO

-- 2. Update usp_GetActiveVaccineLots to include alert status
CREATE OR ALTER PROCEDURE dbo.usp_GetActiveVaccineLots
    @id_CentroVacunacion INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        l.id_LoteVacuna,
        l.NumeroLote,
        v.Nombre AS NombreVacuna,
        f.Fabricante,
        l.FechaCaducidad,
        l.CantidadInicial,
        l.CantidadDisponible,
        l.CantidadMinimaAlerta,
        CASE 
            WHEN l.CantidadDisponible <= l.CantidadMinimaAlerta THEN 1 
            ELSE 0 
        END AS EsBajoStock,
        l.CantidadMaximaCapacidad
    FROM dbo.Lote l
    INNER JOIN dbo.Vacuna v ON l.id_VacunaCatalogo = v.id_Vacuna
    INNER JOIN dbo.Fabricante f ON v.id_Fabricante = f.id_Fabricante
    WHERE l.id_CentroVacunacion = @id_CentroVacunacion
      AND l.CantidadDisponible > 0
      AND l.FechaCaducidad >= CAST(GETDATE() AS DATE)
    ORDER BY l.FechaCaducidad ASC;
END
GO
