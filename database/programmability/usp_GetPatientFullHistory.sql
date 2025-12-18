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

    -- Si no hay historial para el contexto solicitado, devolver conjuntos vacíos con la estructura correcta
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.HistoricoVacunas hv
        WHERE
            (@id_Nino IS NOT NULL AND hv.id_Nino = @id_Nino)
            OR
            (@id_Nino IS NULL AND hv.id_Nino IN (SELECT tn.id_Nino FROM dbo.TutorNino tn WHERE tn.id_Tutor = @id_Tutor))
    )
    BEGIN
        SELECT TOP 0
            id_Historico,
            id_Nino,
            CAST(NULL AS INT) AS id_Tutor,
            CAST(NULL AS NVARCHAR(201)) AS NombrePaciente,
            CAST(NULL AS DATE) AS FechaNacimiento,
            CAST(NULL AS INT) AS EdadActual,
            NotasAdicionales,
            Alergias,
            CAST(NULL AS DATETIME2) AS FechaCreacion
        FROM dbo.HistoricoVacunas;

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
        FROM dbo.HistoricoCita;

        RETURN;
    END;

    -- Registros principales de historial médico
    SELECT
        hv.id_Historico,
        hv.id_Nino,
        tn.id_Tutor AS id_Tutor,
        CASE 
            WHEN @id_Nino IS NOT NULL THEN ISNULL(n.Nombres, '') + CASE WHEN n.Apellidos IS NOT NULL AND n.Apellidos <> '' THEN ' ' + n.Apellidos ELSE '' END
            ELSE ISNULL(t.Nombres, '') + CASE WHEN t.Apellidos IS NOT NULL AND t.Apellidos <> '' THEN ' ' + t.Apellidos ELSE '' END
        END AS NombrePaciente,
        n.FechaNacimiento,
        CASE WHEN n.FechaNacimiento IS NOT NULL THEN DATEDIFF(YEAR, n.FechaNacimiento, GETDATE()) ELSE NULL END AS EdadActual,
        hv.NotasAdicionales,
        hv.Alergias,
        cv.FechaCreacion AS FechaCreacion
    FROM dbo.HistoricoVacunas hv
    LEFT JOIN dbo.Nino n ON hv.id_Nino = n.id_Nino
    LEFT JOIN dbo.TutorNino tn ON hv.id_Nino = tn.id_Nino
    LEFT JOIN dbo.Tutor t ON tn.id_Tutor = t.id_Tutor
    LEFT JOIN dbo.CitaVacunacion cv ON hv.id_Cita = cv.id_Cita
    WHERE
        (@id_Nino IS NOT NULL AND hv.id_Nino = @id_Nino)
        OR
        (@id_Nino IS NULL AND hv.id_Nino IN (SELECT tn2.id_Nino FROM dbo.TutorNino tn2 WHERE tn2.id_Tutor = @id_Tutor));

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