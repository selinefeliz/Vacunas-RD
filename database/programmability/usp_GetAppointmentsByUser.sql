CREATE OR ALTER PROCEDURE [dbo].[usp_GetAppointmentsByUser]
    @id_Usuario INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Tutors can see their own appointments and their children's appointments
    SELECT
        c.id_Cita, 
        c.Fecha, 
        CONVERT(VARCHAR(8), c.Hora, 108) AS Hora,  -- Format HH:MM:SS
        CASE 
            WHEN c.id_Nino IS NOT NULL THEN n.Nombres + ' ' + n.Apellidos
            ELSE u_self.Nombre + ' ' + u_self.Apellido 
        END AS NombrePaciente,
        v.Nombre AS NombreVacuna, 
        cv.NombreCentro, 
        ec.Estado AS EstadoCita,
        c.RequiereTutor,
        c.NombreCompletoPersonalAplicado,
        c.id_PersonalSalud,
        CASE 
            WHEN c.id_PersonalSalud IS NOT NULL 
            THEN COALESCE(u_medico.Nombre + ' ' + u_medico.Apellido, u_medico.Email)
            ELSE NULL 
        END AS NombrePersonalSalud
    FROM dbo.CitaVacunacion c
    LEFT JOIN dbo.Nino n ON c.id_Nino = n.id_Nino
    LEFT JOIN dbo.Usuario u_self ON c.id_UsuarioRegistraCita = u_self.id_Usuario
    -- Join with TutorNino to filter by children belonging to the tutor
    LEFT JOIN dbo.Tutor t_filter ON t_filter.id_Usuario = @id_Usuario
    LEFT JOIN dbo.TutorNino tn ON n.id_Nino = tn.id_Nino AND tn.id_Tutor = t_filter.id_Tutor
    INNER JOIN dbo.Vacuna v ON c.id_Vacuna = v.id_Vacuna
    INNER JOIN dbo.CentroVacunacion cv ON c.id_CentroVacunacion = cv.id_CentroVacunacion
    INNER JOIN dbo.EstadoCita ec ON c.id_EstadoCita = ec.id_Estado
    LEFT JOIN dbo.Usuario u_medico ON c.id_PersonalSalud = u_medico.id_Usuario
    WHERE 
        -- Either the appointment is for a child linked to this tutor
        tn.id_Nino IS NOT NULL
        -- Or it was registered by this user and lacks a linked Nino (it's for themselves)
        OR (c.id_Nino IS NULL AND c.id_UsuarioRegistraCita = @id_Usuario)
    ORDER BY c.Fecha DESC, c.Hora DESC;
END;
GO
