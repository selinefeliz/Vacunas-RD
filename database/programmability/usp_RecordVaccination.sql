CREATE OR ALTER PROCEDURE dbo.usp_RecordVaccination
    @id_Cita INT,
    @id_PersonalSalud_Usuario INT,
    @id_LoteAplicado INT,
    @NombreCompletoPersonalAplicado NVARCHAR(100),
    @DosisAplicada NVARCHAR(50), -- Frontend might send '1ra Dosis', but we will calculate the real dose number internally to validate
    @EdadAlMomento NVARCHAR(20),
    @NotasAdicionales NVARCHAR(MAX) = NULL,
    @Alergias NVARCHAR(MAX) = NULL,

    @OutputMessage NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Standard Status IDs
    DECLARE @id_EstadoAgendada INT = 1;
    DECLARE @id_EstadoConfirmada INT = 2;
    DECLARE @id_EstadoCita_Asistida INT = 3;

    DECLARE @id_Nino INT;
    DECLARE @id_Tutor INT;
    DECLARE @id_Vacuna INT;
    DECLARE @VacunaNombre NVARCHAR(100);
    DECLARE @FabricanteNombre NVARCHAR(100);
    DECLARE @LoteNumero NVARCHAR(50);
    DECLARE @FechaAplicacion DATE;
    
    -- 1. Get Appointment Info
    SELECT @id_Nino = c.id_Nino, @id_Tutor = c.id_UsuarioRegistraCita, @id_Vacuna = c.id_Vacuna, @FechaAplicacion = c.Fecha
    FROM dbo.CitaVacunacion c
    WHERE c.id_Cita = @id_Cita AND c.id_EstadoCita IN (@id_EstadoAgendada, @id_EstadoConfirmada);

    IF @id_Nino IS NULL
    BEGIN
        SET @OutputMessage = 'Error: Cita no encontrada o estado inválido.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- 2. Validate Personal Info
    IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_Usuario = @id_PersonalSalud_Usuario)
    BEGIN
        SET @OutputMessage = 'Error: Personal de salud no válido.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- 3. Validate Inventory (Lote)
    SELECT @LoteNumero = l.NumeroLote, @VacunaNombre = v.Nombre, @FabricanteNombre = f.Fabricante
    FROM dbo.Lote l
    JOIN dbo.Vacuna v ON l.id_VacunaCatalogo = v.id_Vacuna
    JOIN dbo.Fabricante f ON v.id_Fabricante = f.id_Fabricante
    WHERE l.id_LoteVacuna = @id_LoteAplicado;

    IF @LoteNumero IS NULL
    BEGIN
        SET @OutputMessage = 'Error: Lote no encontrado.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    IF (SELECT CantidadDisponible FROM dbo.Lote WHERE id_LoteVacuna = @id_LoteAplicado) <= 0
    BEGIN
        SET @OutputMessage = 'Error: Lote sin stock disponible.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- 4. Get Patient Details for Validation
    DECLARE @FechaNacimiento DATE;
    DECLARE @Genero CHAR(1);
    DECLARE @ExistingAlergias NVARCHAR(MAX);
    DECLARE @ExistingNotas NVARCHAR(MAX);

    SELECT 
        @FechaNacimiento = n.FechaNacimiento,
        -- Use simple Gender mapping if needed, assuming Database stores 'M'/'F' correctly
        @Genero = n.Genero,
        @ExistingAlergias = ISNULL(hm.Alergias, n.Alergias),
        @ExistingNotas = ISNULL(hm.NotasAdicionales, n.NotasAdicionales)
    FROM dbo.Nino n
    LEFT JOIN dbo.HistoricoMedico hm ON n.id_Nino = hm.id_Nino
    WHERE n.id_Nino = @id_Nino;

    IF @Alergias IS NULL OR @Alergias = '' SET @Alergias = @ExistingAlergias;
    IF @NotasAdicionales IS NULL OR @NotasAdicionales = '' SET @NotasAdicionales = @ExistingNotas;

    -- Calculate Age in Months (Accurate)
    DECLARE @EdadMeses INT;
    SET @EdadMeses = DATEDIFF(MONTH, @FechaNacimiento, @FechaAplicacion);
    IF DAY(@FechaAplicacion) < DAY(@FechaNacimiento)
        SET @EdadMeses = @EdadMeses - 1;

    -- ---------------------------------------------------------
    -- 5. VALIDATION LOGIC (RULES ENGINE)
    -- ---------------------------------------------------------
    
    -- Determine current Dose Number
    DECLARE @DosisAnteriores INT;
    SELECT @DosisAnteriores = COUNT(*) 
    FROM HistoricoVacunas hv 
    -- Join with Cita to identify vaccine type if strictly relying on ID? 
    -- Or scan HistoricoVacunas name? Unreliable. 
    -- Better: HistoricoVacunas should link to Vaccine ID or we check based on Cita's vaccine ID.
    -- Current schema: HistoricoVacunas doesn't have id_Vacuna column, only names. 
    -- CRITICAL FIX: To be robust, we need to join back or trust the Name match.
    -- Let's try matching Name for now since the table structure is limited.
    WHERE hv.id_Nino = @id_Nino AND hv.VacunaNombre = @VacunaNombre;

    DECLARE @DosisPropuesta INT = @DosisAnteriores + 1;

    -- Check if Rule Exists
    DECLARE @Rule_MinMeses INT;
    DECLARE @Rule_MaxMeses INT;
    DECLARE @Rule_IntervaloDias INT;
    DECLARE @Rule_Genero CHAR(1);
    
    SELECT 
        @Rule_MinMeses = EdadMinimaMeses,
        @Rule_MaxMeses = EdadMaximaMeses,
        @Rule_IntervaloDias = IntervaloMinimoDias,
        @Rule_Genero = GeneroObjetivo
    FROM dbo.EsquemaVacunacion
    WHERE id_Vacuna = @id_Vacuna AND NumeroDosis = @DosisPropuesta;

    IF @@ROWCOUNT > 0 -- If a rule exists for this dose
    BEGIN
        -- A. Age Validation
        IF @EdadMeses < @Rule_MinMeses
        BEGIN
            SET @OutputMessage = 'Error de Esquema: El paciente es muy joven (' + CAST(@EdadMeses AS NVARCHAR) + ' meses). Edad mínima requerida: ' + CAST(@Rule_MinMeses AS NVARCHAR) + ' meses.';
            RAISERROR(@OutputMessage, 16, 1);
            RETURN;
        END

        IF @Rule_MaxMeses IS NOT NULL AND @EdadMeses > @Rule_MaxMeses
        BEGIN
             SET @OutputMessage = 'Error de Esquema: El paciente excede la edad máxima (' + CAST(@Rule_MaxMeses AS NVARCHAR) + ' meses) para esta dosis.';
            RAISERROR(@OutputMessage, 16, 1);
            RETURN;
        END

        -- B. Gender Validation
        IF @Rule_Genero IS NOT NULL AND @Rule_Genero != 'A' AND @Rule_Genero != @Genero
        BEGIN
             SET @OutputMessage = 'Error de Esquema: Esta vacuna no es aplicable al género del paciente.';
            RAISERROR(@OutputMessage, 16, 1);
            RETURN;
        END

        -- C. Interval Validation (if Dose > 1)
        IF @DosisPropuesta > 1
        BEGIN
            DECLARE @FechaUltimaDosis DATE;
            -- Get date of last dose of this vaccine
            SELECT TOP 1 @FechaUltimaDosis = FechaAplicacion
            FROM HistoricoVacunas
            WHERE id_Nino = @id_Nino AND VacunaNombre = @VacunaNombre
            ORDER BY FechaAplicacion DESC;

            IF @FechaUltimaDosis IS NOT NULL AND @Rule_IntervaloDias IS NOT NULL
            BEGIN
                DECLARE @DiasDesdeUltima INT = DATEDIFF(DAY, @FechaUltimaDosis, @FechaAplicacion);
                IF @DiasDesdeUltima < @Rule_IntervaloDias
                BEGIN
                     SET @OutputMessage = 'Error de Esquema: No se ha cumplido el intervalo mínimo (' + CAST(@Rule_IntervaloDias AS NVARCHAR) + ' días) desde la última dosis (' + CAST(@DiasDesdeUltima AS NVARCHAR) + ' días transcurridos).';
                    RAISERROR(@OutputMessage, 16, 1);
                    RETURN;
                END
            END
        END
    END
    -- If no rule exists, we default to ALLOW (legacy/manual mode), or strict BLOCK? 
    -- Given the user wants strict adherence, maybe warning? 
    -- For now, allow if no rule found to prevent blocking valid but unconfigured vaccines.

    -- ---------------------------------------------------------
    -- END VALIDATION
    -- ---------------------------------------------------------

    -- Recalculate generic Age String for display
    DECLARE @CalculatedEdadAlMomento NVARCHAR(50);
    DECLARE @Anios INT = @EdadMeses / 12;
    DECLARE @MesesRestantes INT = @EdadMeses % 12;
    
    IF @Anios > 0
        SET @CalculatedEdadAlMomento = CAST(@Anios AS NVARCHAR(10)) + ' año(s) ' + CAST(@MesesRestantes AS NVARCHAR(10)) + ' meses';
    ELSE
        SET @CalculatedEdadAlMomento = CAST(@MesesRestantes AS NVARCHAR(10)) + ' meses';

    -- Proceed to Update/Insert
    BEGIN TRANSACTION;

    BEGIN TRY
        MERGE dbo.HistoricoMedico AS target
        USING (SELECT @id_Nino AS id_Nino) AS source
        ON (target.id_Nino = source.id_Nino)
        WHEN MATCHED THEN
            UPDATE SET Alergias = @Alergias, NotasAdicionales = @NotasAdicionales, FechaActualizacion = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (id_Nino, Alergias, NotasAdicionales, FechaCreacion, FechaActualizacion)
            VALUES (@id_Nino, @Alergias, @NotasAdicionales, GETDATE(), GETDATE());

        UPDATE dbo.CitaVacunacion
        SET id_EstadoCita = @id_EstadoCita_Asistida,
            id_PersonalSalud = @id_PersonalSalud_Usuario,
            id_LoteAplicado = @id_LoteAplicado,
            NombreCompletoPersonalAplicado = @NombreCompletoPersonalAplicado
        WHERE id_Cita = @id_Cita;

        UPDATE dbo.Lote
        SET CantidadDisponible = CantidadDisponible - 1
        WHERE id_LoteVacuna = @id_LoteAplicado;

        DECLARE @New_id_Historico INT;

        INSERT INTO dbo.HistoricoVacunas (
            id_Nino, id_Cita, FechaAplicacion, DosisAplicada, EdadAlMomento, 
            EdadRegistroMeses, VacunaNombre, FabricanteNombre, LoteNumero, 
            PersonalSaludNombre, FirmaDigital, NotasAdicionales, Alergias
        )
        VALUES (
            @id_Nino, @id_Cita, @FechaAplicacion, @DosisAplicada, @CalculatedEdadAlMomento, 
            @EdadMeses, @VacunaNombre, @FabricanteNombre, @LoteNumero, 
            @NombreCompletoPersonalAplicado, NULL, @NotasAdicionales, @Alergias
        );

        SET @New_id_Historico = SCOPE_IDENTITY();

        INSERT INTO dbo.HistoricoCita (id_Historico, id_Cita, Vacuna, NombreCompletoPersonal, CentroMedico, Fecha, Hora, Notas)
        SELECT @New_id_Historico, @id_Cita, @VacunaNombre, @NombreCompletoPersonalAplicado, cm.NombreCentro, c.Fecha, c.Hora, @NotasAdicionales
        FROM dbo.CitaVacunacion c
        JOIN dbo.CentroVacunacion cm ON c.id_CentroVacunacion = cm.id_CentroVacunacion
        WHERE c.id_Cita = @id_Cita;

        COMMIT TRANSACTION;
        SET @OutputMessage = 'Vacunación registrada exitosamente. Dosis #' + CAST(@DosisPropuesta AS NVARCHAR);

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @OutputMessage = ERROR_MESSAGE();
        THROW;
        RETURN;
    END CATCH
END;
GO
