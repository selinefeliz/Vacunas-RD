CREATE OR ALTER PROCEDURE dbo.usp_CalcularEsquemaVacunacionNino
    @id_Nino INT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Obtener fecha de nacimiento del nino
    DECLARE @FechaNacimiento DATE;
    SELECT @FechaNacimiento = FechaNacimiento FROM dbo.Nino WHERE id_Nino = @id_Nino;

    IF @FechaNacimiento IS NULL
    BEGIN
        SELECT NULL AS id_Vacuna WHERE 1=0; -- Empty result
        RETURN;
    END

    -- 2. Obtener vacunas ya aplicadas (Citas Asistidas)
    -- Usamos PARTITION para asignar Numero de Dosis segun el orden de aplicacion
    CREATE TABLE #DosisAplicadas (
        id_Vacuna INT,
        DosisNumero INT
    );

    INSERT INTO #DosisAplicadas (id_Vacuna, DosisNumero)
    SELECT 
        id_Vacuna,
        ROW_NUMBER() OVER(PARTITION BY id_Vacuna ORDER BY Fecha ASC) as DosisNumero
    FROM dbo.CitaVacunacion
    WHERE id_Nino = @id_Nino AND id_EstadoCita = (SELECT id_Estado FROM dbo.EstadoCita WHERE Estado = 'Asistida');

    -- 3. Calcular el esquema pendiente
    -- Comparamos lo requerido vs lo aplicado
    SELECT 
        ev.id_Vacuna,
        v.Nombre AS NombreVacuna,
        ev.DosisNumero AS DosisPorAplicar,
        DATEADD(MONTH, ev.EdadMesesRecomendada, @FechaNacimiento) AS FechaSugerida,
        CASE 
            WHEN DATEADD(MONTH, ev.EdadMesesRecomendada, @FechaNacimiento) < CAST(GETDATE() AS DATE) THEN 'Vencida'
            WHEN DATEADD(MONTH, ev.EdadMesesRecomendada, @FechaNacimiento) <= DATEADD(DAY, 30, CAST(GETDATE() AS DATE)) THEN 'Proxima'
            ELSE 'Pendiente'
        END AS Estado,
        'Esquema Oficial' AS Criterio
    FROM dbo.EsquemaVacunacion ev
    INNER JOIN dbo.Vacuna v ON ev.id_Vacuna = v.id_Vacuna
    LEFT JOIN #DosisAplicadas da ON ev.id_Vacuna = da.id_Vacuna AND ev.DosisNumero = da.DosisNumero
    WHERE da.id_Vacuna IS NULL -- Solo mostrar las que NO están aplicadas
    ORDER BY FechaSugerida ASC, ev.DosisNumero ASC;

    DROP TABLE #DosisAplicadas;
END;
GO
