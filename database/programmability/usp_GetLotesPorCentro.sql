-- =============================================
-- Author:      Cascade
-- Create date: 2025-06-14
-- Description: Obtiene la lista de lotes de vacunas para un centro de vacunación específico.
-- =============================================
CREATE OR ALTER PROCEDURE usp_GetLotesPorCentro
    @id_CentroVacunacion INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que el centro de vacunación exista
    IF NOT EXISTS (SELECT 1 FROM dbo.CentroVacunacion WHERE id_CentroVacunacion = @id_CentroVacunacion)
    BEGIN
        RAISERROR('El centro de vacunación especificado no existe.', 16, 1);
        RETURN;
    END

    -- Seleccionar la información de los lotes, uniendo con Vacuna y Fabricante para obtener nombres
    SELECT
        L.id_LoteVacuna,
        L.NumeroLote,
        V.Nombre AS NombreVacuna,
        F.Fabricante AS NombreFabricante,
        L.FechaCaducidad,
        L.CantidadInicial,
        L.CantidadDisponible
    FROM
        dbo.Lote AS L
    INNER JOIN
        dbo.Vacuna AS V ON L.id_VacunaCatalogo = V.id_Vacuna
    INNER JOIN
        dbo.Fabricante AS F ON V.id_Fabricante = F.id_Fabricante
    WHERE
        L.id_CentroVacunacion = @id_CentroVacunacion
    ORDER BY
        L.FechaCaducidad ASC;

END
GO
