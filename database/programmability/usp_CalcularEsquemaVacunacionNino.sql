CREATE OR ALTER PROCEDURE dbo.usp_CalcularEsquemaVacunacionNino
    @id_Nino INT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Get Child's Birth Date
    DECLARE @FechaNacimiento DATE;
    SELECT @FechaNacimiento = FechaNacimiento FROM dbo.Nino WHERE id_Nino = @id_Nino;

    IF @FechaNacimiento IS NULL
    BEGIN
        -- Return empty structure if child not found
        SELECT 
            CAST(NULL AS INT) AS id_Vacuna, 
            CAST(NULL AS NVARCHAR(100)) AS NombreVacuna,
            CAST(NULL AS INT) AS DosisPorAplicar,
            CAST(NULL AS DATE) AS FechaSugerida,
            CAST(NULL AS VARCHAR(20)) AS Estado,
            CAST(NULL AS VARCHAR(20)) AS Criterio
        WHERE 1=0; 
        RETURN;
    END

    -- 2. Identify Vaccines ALREADY Applied or Scheduled
    -- We assume 'Agendada', 'Confirmada', 'Asistida' count as "Taken/Occupied" slots
    CREATE TABLE #DosisOcupadas (
        id_Vacuna INT,
        NumeroDosis INT
    );

    INSERT INTO #DosisOcupadas (id_Vacuna, NumeroDosis)
    SELECT 
        id_Vacuna,
        ROW_NUMBER() OVER(PARTITION BY id_Vacuna ORDER BY Fecha ASC) as NumeroDosis
    FROM dbo.CitaVacunacion
    WHERE id_Nino = @id_Nino 
      AND id_EstadoCita IN (
          SELECT id_Estado FROM dbo.EstadoCita WHERE Estado IN ('Asistida', 'Confirmada', 'Agendada')
      );

    -- 3. Calculate Pending Schedule based on Rules
    SELECT 
        ev.id_Vacuna,
        v.Nombre AS NombreVacuna,
        ev.NumeroDosis AS DosisPorAplicar,
        -- Suggested Date = BirthDate + Minimum Age for that Dose
        DATEADD(MONTH, ev.EdadMinimaMeses, @FechaNacimiento) AS FechaSugerida,
        CASE 
            -- If Suggested Date is in the past, it's 'Vencida' (Overdue)
            WHEN DATEADD(MONTH, ev.EdadMinimaMeses, @FechaNacimiento) < CAST(GETDATE() AS DATE) THEN 'Vencida'
            -- If Suggested Date is within next 30 days, it's 'Proxima' (Upcoming)
            WHEN DATEADD(MONTH, ev.EdadMinimaMeses, @FechaNacimiento) <= DATEADD(DAY, 30, CAST(GETDATE() AS DATE)) THEN 'Proxima'
            -- Otherwise 'Pendiente' (Future)
            ELSE 'Pendiente'
        END AS Estado,
        CASE 
            WHEN ev.EsRefuerzo = 1 THEN 'Refuerzo' 
            ELSE 'Esquema Base' 
        END AS Criterio,
        ev.Descripcion -- Added for UI context if needed
    FROM dbo.EsquemaVacunacion ev
    INNER JOIN dbo.Vacuna v ON ev.id_Vacuna = v.id_Vacuna
    -- Filter out doses that are already "occupied" (done/scheduled)
    LEFT JOIN #DosisOcupadas da ON ev.id_Vacuna = da.id_Vacuna AND ev.NumeroDosis = da.NumeroDosis
    WHERE da.id_Vacuna IS NULL
      -- Optional: Handle Gender check if strictly enforced here (e.g. don't show HPV to Boys)
      AND (ev.GeneroObjetivo = 'A' OR ev.GeneroObjetivo = (SELECT Genero FROM dbo.Nino WHERE id_Nino = @id_Nino))
    ORDER BY FechaSugerida ASC, ev.NumeroDosis ASC;

    DROP TABLE #DosisOcupadas;
END;
GO
