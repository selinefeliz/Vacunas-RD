-- V10: Creates usp_GetAppointmentsByUser to fetch all appointments for a user (self and children)
PRINT 'Creating Stored Procedure usp_GetAppointmentsByUser...';
GO

CREATE PROCEDURE dbo.usp_GetAppointmentsByUser
    @id_Usuario INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate if the User exists
    IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_Usuario = @id_Usuario)
    BEGIN
        PRINT 'User ID not found, returning empty set.';
        RETURN;
    END

    -- Fetch all appointments registered by the user
    SELECT
        c.id_Cita,
        c.Fecha,
        c.Hora,
        v.Nombre AS NombreVacuna,
        cv.NombreCentro AS NombreCentro,
        ec.Estado AS EstadoCita,
        -- Use a CASE statement to show who the appointment is for
        CASE
            WHEN c.id_Nino IS NULL THEN 'Cita Personal'
            ELSE n.Nombres + ' ' + n.Apellidos
        END AS ParaQuien -- "For Whom"
    FROM
        dbo.CitaVacunacion AS c
    LEFT JOIN -- Use LEFT JOIN to include appointments where id_Nino is NULL
        dbo.Nino AS n ON c.id_Nino = n.id_Nino
    JOIN
        dbo.Vacuna AS v ON c.id_Vacuna = v.id_Vacuna
    JOIN
        dbo.CentroVacunacion AS cv ON c.id_CentroVacunacion = cv.id_CentroVacunacion
    JOIN
        dbo.EstadoCita AS ec ON c.id_EstadoCita = ec.id_Estado
    WHERE
        c.id_UsuarioRegistraCita = @id_Usuario -- Filter by the user who registered the appointment
    ORDER BY
        c.Fecha DESC, c.Hora DESC;
END
GO

PRINT 'Stored Procedure usp_GetAppointmentsByUser created successfully.';
GO
