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
                (cv.id_Nino IS NOT NULL AND hv.id_Nino = cv.id_Nino)
            )
        ), 0) AS DosisAplicadas,
        ISNULL(next_dose_schema.IntervaloMinimoDias, 28) AS IntervaloSiguienteDosis -- Default to 28 days if not found
    FROM CitaVacunacion cv
    INNER JOIN Usuario u_registra ON cv.id_UsuarioRegistraCita = u_registra.id_Usuario
    LEFT JOIN Nino n ON cv.id_Nino = n.id_Nino
    LEFT JOIN Tutor t ON u_registra.id_Usuario = t.id_Usuario
    INNER JOIN Vacuna v ON cv.id_Vacuna = v.id_Vacuna
    INNER JOIN CentroVacunacion centro ON cv.id_CentroVacunacion = centro.id_CentroVacunacion
    INNER JOIN EstadoCita ec ON cv.id_EstadoCita = ec.id_Estado
    -- Get Interval for the NEXT dose (Current Dose + 1)
    -- We need to know which dose number this appointment represents.
    -- Assuming one appointment = one dose.
    -- But Esquema is by Vaccine and DoseNumber.
    -- We can try to approximate: if this is Dose 1, we want the interval for Dose 2.
    LEFT JOIN (
       -- Subquery to find the Dose Number for this specific appointment if possible, or assume based on history count + 1?
       -- Better: The appointment itself usually tracks 'DosisNumero' but it's not in CitaVacunacion?
       -- CitaVacunacion doesn't seem to have DosisNumero directly, it's inferred.
       -- Let's use the DosisAplicadas count for that patient + 1 as the current dose being scheduled/attended?
       -- Wait, if I am attending an appointment, it IS the next dose.
       -- So I need the interval required *after* this dose to schedule the *next* one.
       -- So if I am attending Dose 1, I need Interval for Dose 2.
       SELECT id_Vacuna, NumeroDosis, IntervaloMinimoDias
       FROM dbo.EsquemaVacunacion
    ) next_dose_schema ON next_dose_schema.id_Vacuna = cv.id_Vacuna 
      AND next_dose_schema.NumeroDosis = (
          -- Current Dose Count + 1 (This appointment) + 1 (The next one) => Current Count + 2?
          -- Let's simplify:
          -- Current successful doses count = DosisAplicadas
          -- This appointment is for DosisAplicadas + 1.
          -- We want to schedule DosisAplicadas + 2.
          (SELECT COUNT(*) FROM HistoricoVacunas h WHERE h.id_Nino = cv.id_Nino AND h.id_Vacuna = cv.id_Vacuna) + 2
      )

    WHERE cv.id_CentroVacunacion = @id_CentroVacunacion
      -- Allow seeing appointments that are not yet assigned to a doctor (NULL) or assigned to this doctor
      -- Actually, for a center view, usually all pending appointments are visible to all doctors.
      -- Removing strict PersonalSalud filter to allow picking up pool appointments.
      -- AND (cv.id_PersonalSalud IS NULL OR cv.id_PersonalSalud = @id_PersonalSalud) 
      
      -- Filter by Status: Show 'Agendada' (Scheduled) and 'Confirmada' (Confirmed)
      -- Filter by Status: Show 'Agendada', 'Confirmada', and cancellations/no-shows for context
      AND ec.Estado IN ('Agendada', 'Confirmada', 'Cancelada', 'Cancelada por Paciente', 'Cancelada por Centro', 'No Asistio', 'No Suministrada')
    ORDER BY cv.Fecha ASC, cv.Hora ASC;
END
GO
