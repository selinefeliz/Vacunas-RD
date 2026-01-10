-- Created by GitHub Copilot in SSMS - review carefully before executing
CREATE OR ALTER PROCEDURE dbo.usp_GetPatientFullHistory
    @id_Usuario INT,
    @id_Nino INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id_Tutor INT;
    SELECT TOP(1) @id_Tutor = t.id_Tutor
    FROM dbo.Tutor t
    WHERE t.id_Usuario = @id_Usuario;

    -- Check if patient exists (medical history is now stored in Nino table)
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.Nino n
        LEFT JOIN dbo.TutorNino tn ON n.id_Nino = tn.id_Nino
        WHERE
            (@id_Nino IS NOT NULL AND n.id_Nino = @id_Nino)
            OR
            (@id_Nino IS NULL AND tn.id_Tutor = @id_Tutor)
    )
    BEGIN
        SELECT TOP 0
            CAST(NULL AS INT) AS id_Historico,
            CAST(NULL AS INT) AS id_Nino,
            CAST(NULL AS INT) AS id_Tutor,
            CAST(NULL AS NVARCHAR(201)) AS NombrePaciente,
            CAST(NULL AS DATE) AS FechaNacimiento,
            CAST(NULL AS INT) AS EdadActual,
            CAST(NULL AS NVARCHAR(MAX)) AS NotasAdicionales,
            CAST(NULL AS NVARCHAR(MAX)) AS Alergias,
            CAST(NULL AS DATETIME2) AS FechaCreacion;

        SELECT TOP 0
            id_Historico,
            id_Cita,
            Vacuna,
            NombreCompletoPersonal,
            CAST(NULL AS NVARCHAR(50)) AS NumeroLote,
            CentroMedico,
            Fecha AS FechaAplicacion,
            Hora AS HoraAplicacion,
            Notas,
            CAST(NULL AS DATE) AS FechaCita,
            CAST(NULL AS TIME) AS HoraCita,
            CAST(NULL AS INT) AS DosisLimite,
            CAST(NULL AS BIGINT) AS NumeroDosis
        FROM dbo.HistoricoCita WHERE 1=0;

        RETURN;
    END;


    -- Registros principales de historial médico
    -- Now reading Alergias and NotasAdicionales from HistoricoMedico table (source of truth for history existence)
    SELECT
        n.id_Nino AS id_Historico,
        n.id_Nino,
        tn.id_Tutor AS id_Tutor,
        CASE 
            WHEN @id_Nino IS NOT NULL THEN ISNULL(n.Nombres, '') + CASE WHEN n.Apellidos IS NOT NULL AND n.Apellidos <> '' THEN ' ' + n.Apellidos ELSE '' END
            ELSE ISNULL(t.Nombres, '') + CASE WHEN t.Apellidos IS NOT NULL AND t.Apellidos <> '' THEN ' ' + t.Apellidos ELSE '' END
        END AS NombrePaciente,
        n.FechaNacimiento,
        CASE 
            WHEN n.FechaNacimiento IS NOT NULL THEN 
                DATEDIFF(YEAR, n.FechaNacimiento, GETDATE()) - 
                CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, n.FechaNacimiento, GETDATE()), n.FechaNacimiento) > GETDATE() 
                THEN 1 ELSE 0 END
            ELSE NULL 
        END AS EdadActual,
        hm.NotasAdicionales,
        hm.Alergias,
        hm.FechaCreacion -- Will be NULL if no history exists
    FROM dbo.Nino n
    LEFT JOIN dbo.TutorNino tn ON n.id_Nino = tn.id_Nino
    LEFT JOIN dbo.Tutor t ON tn.id_Tutor = t.id_Tutor
    LEFT JOIN dbo.HistoricoMedico hm ON n.id_Nino = hm.id_Nino -- Join with History table
    WHERE
        (@id_Nino IS NOT NULL AND n.id_Nino = @id_Nino)
        OR
        (@id_Nino IS NULL AND n.id_Nino IN (SELECT tn2.id_Nino FROM dbo.TutorNino tn2 WHERE tn2.id_Tutor = @id_Tutor));


    -- Historial detallado de vacunación
    SELECT
        hv.id_Historico,
        hc.id_Cita,
        hc.Vacuna,
        ISNULL(cv.NombreCompletoPersonalAplicado, u.Nombre + ' ' + u.Apellido) AS NombreCompletoPersonal,
        l.NumeroLote,
        hc.CentroMedico,
        hc.Fecha AS FechaAplicacion,
        hc.Hora AS HoraAplicacion,
        hc.Notas,
        cv.Fecha AS FechaCita,
        cv.Hora AS HoraCita,
        v.DosisLimite,
        ROW_NUMBER() OVER (PARTITION BY cv.id_Vacuna ORDER BY hc.Fecha ASC, hc.Hora ASC) AS NumeroDosis
    FROM dbo.HistoricoVacunas hv
    JOIN dbo.HistoricoCita hc ON hv.id_Historico = hc.id_Historico
    JOIN dbo.CitaVacunacion cv ON hc.id_Cita = cv.id_Cita
    LEFT JOIN dbo.Vacuna v ON cv.id_Vacuna = v.id_Vacuna
    LEFT JOIN dbo.Usuario u ON cv.id_PersonalSalud = u.id_Usuario
    LEFT JOIN dbo.Lote l ON cv.id_LoteAplicado = l.id_LoteVacuna
    WHERE
        (@id_Nino IS NOT NULL AND cv.id_Nino = @id_Nino)
        OR
        (@id_Nino IS NULL AND cv.id_Nino IN (SELECT tn3.id_Nino FROM dbo.TutorNino tn3 WHERE tn3.id_Tutor = @id_Tutor))
    ORDER BY hc.Fecha DESC, hc.Hora DESC;
END;