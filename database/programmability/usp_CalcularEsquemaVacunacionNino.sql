CREATE OR ALTER PROCEDURE dbo.usp_CalcularEsquemaVacunacionNino
    @id_Nino INT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Get Child's Birth Date, Registration Date & Calculate Current Age
    DECLARE @FechaNacimiento DATE;
    DECLARE @FechaRegistro DATE;
    SELECT @FechaNacimiento = FechaNacimiento, @FechaRegistro = CAST(FechaRegistro AS DATE) 
    FROM dbo.Nino WHERE id_Nino = @id_Nino;

    IF @FechaNacimiento IS NULL
    BEGIN
        SELECT TOP 0 NULL as id_Vacuna WHERE 1=0; 
        RETURN;
    END

    DECLARE @Today DATE = CAST(GETDATE() AS DATE);
    DECLARE @EdadMesesActual INT;
    SET @EdadMesesActual = DATEDIFF(MONTH, @FechaNacimiento, @Today);
    IF DAY(@Today) < DAY(@FechaNacimiento)
        SET @EdadMesesActual = @EdadMesesActual - 1;

    -- 2. Get Vaccination History
    CREATE TABLE #DosisAplicadas (
        id_Vacuna INT,
        FechaAplicacion DATE
    );

    INSERT INTO #DosisAplicadas (id_Vacuna, FechaAplicacion)
    SELECT c.id_Vacuna, c.Fecha FROM dbo.CitaVacunacion c
    WHERE c.id_Nino = @id_Nino AND c.id_EstadoCita IN (SELECT id_Estado FROM dbo.EstadoCita WHERE Estado = 'Asistida');

    INSERT INTO #DosisAplicadas (id_Vacuna, FechaAplicacion)
    SELECT v.id_Vacuna, h.FechaAplicacion FROM dbo.HistoricoVacunas h
    INNER JOIN dbo.Vacuna v ON LTRIM(RTRIM(h.VacunaNombre)) = LTRIM(RTRIM(v.Nombre))
    WHERE h.id_Nino = @id_Nino
    AND NOT EXISTS (SELECT 1 FROM #DosisAplicadas da WHERE da.id_Vacuna = v.id_Vacuna AND da.FechaAplicacion = h.FechaAplicacion);

    SELECT id_Vacuna, FechaAplicacion, ROW_NUMBER() OVER(PARTITION BY id_Vacuna ORDER BY FechaAplicacion ASC) as NumeroDosis
    INTO #DosisRanking FROM #DosisAplicadas;

    -- 3. Group Sync Logic: Sequentially determine Anchor Dates for each Age Group
    CREATE TABLE #Grupos (
        EdadMinimaMeses INT PRIMARY KEY,
        Seq INT,
        MaxFechaAplicacion DATE,
        EsCompletado BIT DEFAULT 0,
        FechaSugerida DATE,
        AnchorDate DATE
    );

    INSERT INTO #Grupos (EdadMinimaMeses, Seq)
    SELECT EdadMinimaMeses, ROW_NUMBER() OVER(ORDER BY EdadMinimaMeses)
    FROM (SELECT DISTINCT EdadMinimaMeses FROM dbo.EsquemaVacunacion) t;

    -- Update completion status per group
    -- A group is considered "done" if all vaccine doses mapped to that age are in history
    UPDATE g
    SET EsCompletado = CASE WHEN NOT EXISTS (
                           SELECT 1 FROM dbo.EsquemaVacunacion ev
                           LEFT JOIN #DosisRanking dr ON ev.id_Vacuna = dr.id_Vacuna AND ev.NumeroDosis = dr.NumeroDosis
                           WHERE ev.EdadMinimaMeses = g.EdadMinimaMeses AND dr.FechaAplicacion IS NULL
                       ) THEN 1 ELSE 0 END,
        MaxFechaAplicacion = (
            SELECT MAX(dr.FechaAplicacion)
            FROM dbo.EsquemaVacunacion ev
            JOIN #DosisRanking dr ON ev.id_Vacuna = dr.id_Vacuna AND ev.NumeroDosis = dr.NumeroDosis
            WHERE ev.EdadMinimaMeses = g.EdadMinimaMeses
        )
    FROM #Grupos g;

    -- Pass 1: Initial Group (Usually Birth at 0 months)
    UPDATE #Grupos 
    SET FechaSugerida = @FechaNacimiento, 
        AnchorDate = ISNULL(MaxFechaAplicacion, @FechaNacimiento)
    WHERE Seq = 1;

    -- Pass 2+: Sequential Grouping
    DECLARE @i INT = 2;
    DECLARE @MaxSeq INT = (SELECT MAX(Seq) FROM #Grupos);
    WHILE @i <= @MaxSeq
    BEGIN
        DECLARE @PrevAnchor DATE, @PrevAge INT, @CurrAge INT;
        SELECT @PrevAnchor = AnchorDate, @PrevAge = EdadMinimaMeses FROM #Grupos WHERE Seq = @i - 1;
        SELECT @CurrAge = EdadMinimaMeses FROM #Grupos WHERE Seq = @i;
        
        DECLARE @Gap INT = @CurrAge - @PrevAge;
        DECLARE @Sugg DATE = DATEADD(MONTH, @Gap, @PrevAnchor);
        
        -- Floor checks: Cannot be before Ideal or Registration Date
        DECLARE @Ideal DATE = DATEADD(MONTH, @CurrAge, @FechaNacimiento);
        IF @Sugg < @Ideal SET @Sugg = @Ideal;
        IF @Sugg < @FechaRegistro SET @Sugg = @FechaRegistro;
        
        UPDATE #Grupos 
        SET FechaSugerida = @Sugg,
            AnchorDate = ISNULL(MaxFechaAplicacion, @Sugg)
        WHERE Seq = @i;

        SET @i = @i + 1;
    END

    -- 4. Calculate Final Schedule Output based on Synced Group Dates
    SELECT 
        ev.id_Vacuna, v.Nombre AS NombreVacuna, ev.NumeroDosis AS DosisPorAplicar,
        g.FechaSugerida,
        CASE 
            WHEN ev.EdadMaximaMeses IS NOT NULL AND @EdadMesesActual > ev.EdadMaximaMeses THEN 'Edad Excedida'
            WHEN cur.id_Vacuna IS NOT NULL THEN 'Completada'
            WHEN DATEADD(MONTH, ev.EdadMinimaMeses, @FechaNacimiento) < @Today THEN 'Vencida'
            WHEN g.FechaSugerida <= DATEADD(DAY, 30, @Today) THEN 'Proxima'
            WHEN g.FechaSugerida > DATEADD(DAY, 45, @Today) THEN 'Futura'
            ELSE 'Pendiente'
        END AS Estado,
        CASE WHEN ev.EsRefuerzo = 1 THEN 'Refuerzo' ELSE 'Esquema Base' END AS Criterio,
        ev.Descripcion, ev.EdadMinimaMeses, ev.EdadMaximaMeses
    FROM dbo.EsquemaVacunacion ev
    INNER JOIN dbo.Vacuna v ON ev.id_Vacuna = v.id_Vacuna
    INNER JOIN #Grupos g ON ev.EdadMinimaMeses = g.EdadMinimaMeses
    LEFT JOIN #DosisRanking cur ON ev.id_Vacuna = cur.id_Vacuna AND ev.NumeroDosis = cur.NumeroDosis
    WHERE cur.FechaAplicacion IS NULL
      AND (ev.GeneroObjetivo = 'A' OR ev.GeneroObjetivo = (SELECT Genero FROM dbo.Nino WHERE id_Nino = @id_Nino))
    ORDER BY ev.EdadMinimaMeses ASC, NombreVacuna ASC;

    DROP TABLE #DosisAplicadas;
    DROP TABLE #DosisRanking;
    DROP TABLE #Grupos;
END;
