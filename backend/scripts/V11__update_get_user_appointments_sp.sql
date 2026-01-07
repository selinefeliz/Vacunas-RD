-- V11: Update usp_GetAppointmentsByUser to include patient and doctor information
PRINT 'Updating Stored Procedure usp_GetAppointmentsByUser...';
GO

IF OBJECT_ID('dbo.usp_GetAppointmentsByUser', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_GetAppointmentsByUser;
END
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
        SELECT
            CAST(NULL AS INT) AS id_Cita,
            CAST(NULL AS NVARCHAR(200)) AS NombrePaciente,
            CAST(NULL AS DATE) AS Fecha,
            CAST(NULL AS TIME) AS Hora,
            CAST(NULL AS NVARCHAR(100)) AS NombreVacuna,
            CAST(NULL AS NVARCHAR(100)) AS NombreCentro,
            CAST(NULL AS NVARCHAR(50)) AS EstadoCita,
            CAST(NULL AS BIT) AS RequiereTutor,
            CAST(NULL AS NVARCHAR(100)) AS NombreCompletoPersonalAplicado,
            CAST(NULL AS INT) AS id_PersonalSalud,
            CAST(NULL AS NVARCHAR(200)) AS NombrePersonalSalud
        WHERE 1 = 0;
        RETURN;
    END

    SELECT 
        c.id_Cita,
        -- Determine patient name: child's full name, tutor's name, or registering user's email
        COALESCE(n.Nombres + ' ' + n.Apellidos,
                 t_registra.Nombres + ' ' + t_registra.Apellidos,
                 u_registra.Email,
                 'Sin nombre') AS NombrePaciente,
        c.Fecha,
        c.Hora,
        v.Nombre AS NombreVacuna,
        cv.NombreCentro AS NombreCentro,
        ec.Estado AS EstadoCita,
        c.RequiereTutor,
        c.NombreCompletoPersonalAplicado,
        c.id_PersonalSalud,
        -- Doctor name if assigned
        CASE 
            WHEN c.id_PersonalSalud IS NOT NULL 
            THEN COALESCE(t_medico.Nombres + ' ' + t_medico.Apellidos, u_medico.Email)
            ELSE NULL 
        END AS NombrePersonalSalud
    FROM dbo.CitaVacunacion AS c
    INNER JOIN dbo.Vacuna AS v ON c.id_Vacuna = v.id_Vacuna
    INNER JOIN dbo.CentroVacunacion AS cv ON c.id_CentroVacunacion = cv.id_CentroVacunacion
    INNER JOIN dbo.EstadoCita AS ec ON c.id_EstadoCita = ec.id_Estado
    LEFT JOIN dbo.Nino AS n ON c.id_Nino = n.id_Nino
    LEFT JOIN dbo.Usuario AS u_registra ON c.id_UsuarioRegistraCita = u_registra.id_Usuario
    LEFT JOIN dbo.Tutor AS t_registra ON u_registra.id_Usuario = t_registra.id_Usuario
    LEFT JOIN dbo.Usuario AS u_medico ON c.id_PersonalSalud = u_medico.id_Usuario
    LEFT JOIN dbo.Tutor AS t_medico ON u_medico.id_Usuario = t_medico.id_Usuario
    WHERE c.id_UsuarioRegistraCita = @id_Usuario
    ORDER BY c.Fecha DESC, c.Hora DESC;
END
GO

PRINT 'Stored Procedure usp_GetAppointmentsByUser updated successfully.';
GO
