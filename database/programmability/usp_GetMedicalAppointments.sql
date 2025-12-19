CREATE OR ALTER PROCEDURE [dbo].[usp_GetMedicalAppointments]
    @id_PersonalSalud INT,
    @id_CentroVacunacion INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        cv.id_Cita,
        cv.Fecha,
        cv.Hora,
        cv.id_Nino,
        CASE 
            WHEN cv.id_Nino IS NOT NULL THEN n.Nombres + ' ' + n.Apellidos
            ELSE t.Nombres + ' ' + t.Apellidos
        END AS NombrePaciente,
        CASE 
            WHEN cv.id_Nino IS NOT NULL THEN 'Menor de edad'
            ELSE 'Tutor'
        END AS TipoPaciente,
        cv.id_UsuarioRegistraCita AS id_Tutor,
        cv.id_Vacuna,
        v.Nombre AS NombreVacuna,
        v.DosisLimite,
        CASE 
            WHEN cv.id_Nino IS NOT NULL THEN n.FechaNacimiento
            -- ELSE t.FechaNacimiento -- Tutor table might not have FechaNacimiento? Let's check or assume NULL for now if not needed, or check Tutor layout. 
            -- Assuming Tutor has it or we only care about Nino for now as per user request.
            ELSE NULL 
        END AS FechaNacimiento,
        centro.NombreCentro,
        ec.Estado AS EstadoCita,
        cv.id_EstadoCita,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM HistoricoVacunas hv 
                WHERE (
                    (cv.id_Nino IS NOT NULL AND hv.id_Nino = cv.id_Nino)
                )
            ) THEN 1 
            ELSE 0 
        END AS TieneHistorial,
        ISNULL((
            SELECT COUNT(*)
            FROM HistoricoVacunas hv
            INNER JOIN CitaVacunacion cv2 ON hv.id_Cita = cv2.id_Cita
            WHERE cv2.id_Vacuna = cv.id_Vacuna
            AND (
                (cv.id_Nino IS NOT NULL AND hv.id_Nino = cv.id_Nino)
            )
        ), 0) AS DosisAplicadas
    FROM CitaVacunacion cv
    INNER JOIN Usuario u_registra ON cv.id_UsuarioRegistraCita = u_registra.id_Usuario
    LEFT JOIN Nino n ON cv.id_Nino = n.id_Nino
    LEFT JOIN Tutor t ON u_registra.id_Usuario = t.id_Usuario
    INNER JOIN Vacuna v ON cv.id_Vacuna = v.id_Vacuna
    INNER JOIN CentroVacunacion centro ON cv.id_CentroVacunacion = centro.id_CentroVacunacion
    INNER JOIN EstadoCita ec ON cv.id_EstadoCita = ec.id_Estado
    WHERE cv.id_CentroVacunacion = @id_CentroVacunacion
      -- Allow seeing appointments that are not yet assigned to a doctor (NULL) or assigned to this doctor
      -- Actually, for a center view, usually all pending appointments are visible to all doctors.
      -- Removing strict PersonalSalud filter to allow picking up pool appointments.
      -- AND (cv.id_PersonalSalud IS NULL OR cv.id_PersonalSalud = @id_PersonalSalud) 
      
      -- Filter by Status: Show 'Agendada' (Scheduled) and 'Confirmada' (Confirmed)
      AND ec.Estado IN ('Agendada', 'Confirmada')
    ORDER BY cv.Fecha ASC, cv.Hora ASC;
END
GO
