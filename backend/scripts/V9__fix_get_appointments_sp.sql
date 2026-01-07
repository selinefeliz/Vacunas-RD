-- V9: Corrects usp_GetAppointmentsByNino to use the CitaVacunacion table
PRINT 'Updating Stored Procedure usp_GetAppointmentsByNino...';
GO

IF OBJECT_ID('dbo.usp_GetAppointmentsByNino', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_GetAppointmentsByNino;
END
GO

CREATE PROCEDURE dbo.usp_GetAppointmentsByNino
    @id_Nino INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate if the Nino exists
    IF NOT EXISTS (SELECT 1 FROM dbo.Nino WHERE id_Nino = @id_Nino)
    BEGIN
        PRINT 'Nino ID not found, returning empty set.';
        SELECT
            CAST(NULL AS INT) AS id_Cita,
            CAST(NULL AS DATE) AS Fecha,
            CAST(NULL AS TIME) AS Hora,
            CAST(NULL AS NVARCHAR(100)) AS NombreVacuna,
            CAST(NULL AS NVARCHAR(100)) AS NombreCentro,
            CAST(NULL AS NVARCHAR(50)) AS EstadoCita
        WHERE 1 = 0; -- Ensures structure is returned but no rows
        RETURN;
    END

    -- Fetch appointments for the given Nino
    SELECT
        c.id_CitaVacunacion AS id_Cita,
        c.Fecha,
        c.Hora,
        v.Nombre AS NombreVacuna,
        cv.Nombre AS NombreCentro,
        ec.Descripcion AS EstadoCita
    FROM
        dbo.CitaVacunacion AS c
    JOIN
        dbo.Vacuna AS v ON c.id_Vacuna = v.id_Vacuna
    JOIN
        dbo.CentroVacunacion AS cv ON c.id_CentroVacunacion = cv.id_CentroVacunacion
    JOIN
        dbo.EstadoCita AS ec ON c.id_EstadoCita = ec.id_EstadoCita
    WHERE
        c.id_Nino = @id_Nino
    ORDER BY
        c.Fecha DESC, c.Hora DESC;
END
GO

PRINT 'Stored Procedure usp_GetAppointmentsByNino updated successfully.';
GO
