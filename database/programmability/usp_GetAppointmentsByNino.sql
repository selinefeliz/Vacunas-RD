PRINT 'Creating Stored Procedure usp_GetAppointmentsByNino...';
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

    -- Validate Nino exists
    IF NOT EXISTS (SELECT 1 FROM dbo.Nino WHERE id_Nino = @id_Nino)
    BEGIN
        PRINT 'Error: Nino with ID ' + CAST(@id_Nino AS VARCHAR(10)) + ' not found.';
        -- Return an empty result set
        RETURN;
    END

    SELECT 
        c.id_Cita,
        c.id_Vacuna, -- Added missing ID for frontend matching
        c.Fecha, -- Removed alias to match 'Fecha' in interface
        c.Hora, -- Removed alias to match 'Hora' in interface
        v.Nombre AS NombreVacuna,
        cvc.NombreCentro AS NombreCentroVacunacion,
        ec.Estado AS EstadoCita,
        c.NombreCompletoPersonalAplicado,
        l.NumeroLote AS LoteAplicadoNumero,
        l.FechaCaducidad AS LoteFechaCaducidad,
        u_registra.Email AS EmailUsuarioRegistraCita,
        u_personal.Email AS EmailPersonalSaludAsignado
    FROM 
        dbo.CitaVacunacion c
    JOIN 
        dbo.Vacuna v ON c.id_Vacuna = v.id_Vacuna
    JOIN 
        dbo.CentroVacunacion cvc ON c.id_CentroVacunacion = cvc.id_CentroVacunacion
    JOIN 
        dbo.EstadoCita ec ON c.id_EstadoCita = ec.id_Estado
    JOIN
        dbo.Usuario u_registra ON c.id_UsuarioRegistraCita = u_registra.id_Usuario
    LEFT JOIN 
        dbo.Lote l ON c.id_LoteAplicado = l.id_LoteVacuna -- Left join as lot is only present if vaccine administered
    LEFT JOIN
        dbo.Usuario u_personal ON c.id_PersonalSalud = u_personal.id_Usuario -- Left join as personal salud might not be assigned yet or is optional
    WHERE 
        c.id_Nino = @id_Nino
    ORDER BY
        c.Fecha DESC, c.Hora DESC; -- Show most recent appointments first

END;
GO

PRINT 'Stored Procedure usp_GetAppointmentsByNino created/updated successfully.';
GO

-- Example Usage:
/*
-- Assuming a Nino with ID 1 exists and has appointments:
EXEC dbo.usp_GetAppointmentsByNino @id_Nino = 1;

-- Assuming a Nino with ID 999 does not exist or has no appointments:
EXEC dbo.usp_GetAppointmentsByNino @id_Nino = 999;
*/
GO
