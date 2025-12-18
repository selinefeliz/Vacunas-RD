-- Removed USE Vaccine;
GO

CREATE OR ALTER PROCEDURE usp_GetAppointmentsByCenter
    @id_CentroVacunacion INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.id_Cita,
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
        CASE 
            WHEN c.id_PersonalSalud IS NOT NULL 
            THEN COALESCE(t_medico.Nombres + ' ' + t_medico.Apellidos, u_medico.Email)
            ELSE NULL 
        END AS NombrePersonalSalud
    FROM CitaVacunacion c
    INNER JOIN CentroVacunacion cv ON c.id_CentroVacunacion = cv.id_CentroVacunacion
    INNER JOIN Vacuna v ON c.id_Vacuna = v.id_Vacuna
    INNER JOIN EstadoCita ec ON c.id_EstadoCita = ec.id_Estado
    LEFT JOIN Nino n ON c.id_Nino = n.id_Nino
    LEFT JOIN Usuario u_registra ON c.id_UsuarioRegistraCita = u_registra.id_Usuario
    LEFT JOIN Tutor t_registra ON u_registra.id_Usuario = t_registra.id_Usuario
    LEFT JOIN Usuario u_medico ON c.id_PersonalSalud = u_medico.id_Usuario
    LEFT JOIN Tutor t_medico ON u_medico.id_Usuario = t_medico.id_Usuario
    WHERE c.id_CentroVacunacion = @id_CentroVacunacion
    ORDER BY c.Fecha DESC, c.Hora DESC;
END
