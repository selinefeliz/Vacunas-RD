PRINT 'Creating Stored Procedure usp_RecordVaccination...';
GO

IF OBJECT_ID('dbo.usp_RecordVaccination', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_RecordVaccination;
END
GO

IF OBJECT_ID('dbo.usp_RecordVaccination', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_RecordVaccination;
END
GO

CREATE PROCEDURE dbo.usp_RecordVaccination
    @id_Cita INT,
    @id_PersonalSalud_Usuario INT, -- User ID of the logged-in health personnel
    @id_LoteAplicado INT,
    @NombreCompletoPersonalAplicado NVARCHAR(100), -- Name of person who physically administered, could be different
    @DosisAplicada NVARCHAR(50), -- e.g., '1st Dose', '2nd Dose', 'Booster'
    @EdadAlMomento NVARCHAR(20), -- e.g., '2 años, 3 meses' (ignored, calculated internally)
    @NotasAdicionales NVARCHAR(MAX) = NULL,
    @Alergias NVARCHAR(MAX) = NULL,

    @OutputMessage NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Hardcoded state IDs based on the application's design
    -- 1 = Agendada, 2 = Confirmada, 3 = Asistida
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

    -- Validate Cita exists and is in a schedulable state (using IDs)
    SELECT @id_Nino = c.id_Nino, @id_Tutor = c.id_UsuarioRegistraCita, @id_Vacuna = c.id_Vacuna, @FechaAplicacion = c.Fecha
    FROM dbo.CitaVacunacion c
    WHERE c.id_Cita = @id_Cita AND c.id_EstadoCita IN (@id_EstadoAgendada, @id_EstadoConfirmada);

    IF @id_Nino IS NULL
    BEGIN
        SET @OutputMessage = 'Error: Valid Appointment ID not found or appointment is not in a state that can be marked as attended.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- Validate PersonalSalud_Usuario exists
    IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_Usuario = @id_PersonalSalud_Usuario)
    BEGIN
        SET @OutputMessage = 'Error: Specified Health Personnel User ID does not exist.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- Validate LoteAplicado exists and has quantity
    SELECT @LoteNumero = l.NumeroLote, @VacunaNombre = v.Nombre, @FabricanteNombre = f.Fabricante
    FROM dbo.Lote l
    JOIN dbo.Vacuna v ON l.id_VacunaCatalogo = v.id_Vacuna
    JOIN dbo.Fabricante f ON v.id_Fabricante = f.id_Fabricante
    WHERE l.id_LoteVacuna = @id_LoteAplicado;

    IF @LoteNumero IS NULL
    BEGIN
        SET @OutputMessage = 'Error: Specified Vaccine Lot ID does not exist.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    IF (SELECT CantidadDisponible FROM dbo.Lote WHERE id_LoteVacuna = @id_LoteAplicado) <= 0
    BEGIN
        SET @OutputMessage = 'Error: No available quantity in the specified Vaccine Lot.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- AUTO-FILL DATA: Fetch Allergies, Notes and BirthDate from Nino/HistoricoMedico
    DECLARE @FechaNacimiento DATE;
    DECLARE @ExistingAlergias NVARCHAR(MAX);
    DECLARE @ExistingNotas NVARCHAR(MAX);

    SELECT 
        @FechaNacimiento = n.FechaNacimiento,
        -- Prioritize HistoricoMedico (autofilled table), fallback to Nino
        @ExistingAlergias = ISNULL(hm.Alergias, n.Alergias),
        @ExistingNotas = ISNULL(hm.NotasAdicionales, n.NotasAdicionales)
    FROM dbo.Nino n
    LEFT JOIN dbo.HistoricoMedico hm ON n.id_Nino = hm.id_Nino
    WHERE n.id_Nino = @id_Nino;

    -- Use existing data if parameters are empty/null (which they are from frontend now)
    IF @Alergias IS NULL OR @Alergias = '' SET @Alergias = @ExistingAlergias;
    IF @NotasAdicionales IS NULL OR @NotasAdicionales = '' SET @NotasAdicionales = @ExistingNotas;

    -- CALCULATE AGE
    DECLARE @EdadRegistroMeses INT;
    DECLARE @CalculatedEdadAlMomento NVARCHAR(50);

    IF @FechaNacimiento IS NOT NULL
    BEGIN
        -- Calculate accurate months
        SET @EdadRegistroMeses = DATEDIFF(MONTH, @FechaNacimiento, @FechaAplicacion);
        
        -- Adjust if day of month hasn't passed in the target month (approximate check)
        IF DAY(@FechaAplicacion) < DAY(@FechaNacimiento)
        BEGIN
            SET @EdadRegistroMeses = @EdadRegistroMeses - 1;
        END

        -- Determine text representation 'X años Y meses'
        DECLARE @Anios INT;
        DECLARE @MesesRestantes INT;

        IF @EdadRegistroMeses < 0 SET @EdadRegistroMeses = 0; -- Safety check
        
        SET @Anios = @EdadRegistroMeses / 12;
        SET @MesesRestantes = @EdadRegistroMeses % 12;
        
        IF @Anios > 0
        BEGIN
            SET @CalculatedEdadAlMomento = CAST(@Anios AS NVARCHAR(10)) + ' año' + CASE WHEN @Anios > 1 THEN 's' ELSE '' END;
            IF @MesesRestantes > 0
                SET @CalculatedEdadAlMomento = @CalculatedEdadAlMomento + ', ' + CAST(@MesesRestantes AS NVARCHAR(10)) + ' mes' + CASE WHEN @MesesRestantes > 1 THEN 'es' ELSE '' END;
        END
        ELSE
        BEGIN
            -- Less than 1 year
            IF @MesesRestantes > 0
                SET @CalculatedEdadAlMomento = CAST(@MesesRestantes AS NVARCHAR(10)) + ' mes' + CASE WHEN @MesesRestantes > 1 THEN 'es' ELSE '' END;
            ELSE
            BEGIN
                -- Less than 1 month (days)
                DECLARE @Dias INT = DATEDIFF(DAY, @FechaNacimiento, @FechaAplicacion);
                SET @CalculatedEdadAlMomento = CAST(@Dias AS NVARCHAR(10)) + ' día' + CASE WHEN @Dias > 1 THEN 's' ELSE '' END;
            END
        END
    END
    ELSE
    BEGIN
        SET @EdadRegistroMeses = 0;
        SET @CalculatedEdadAlMomento = 'N/A';
    END

    -- Override the parameter with our calculation
    SET @EdadAlMomento = @CalculatedEdadAlMomento;

    BEGIN TRANSACTION;

    BEGIN TRY
        -- Update CitaVacunacion
        UPDATE dbo.CitaVacunacion
        SET id_EstadoCita = @id_EstadoCita_Asistida,
            id_PersonalSalud = @id_PersonalSalud_Usuario,
            id_LoteAplicado = @id_LoteAplicado,
            NombreCompletoPersonalAplicado = @NombreCompletoPersonalAplicado
        WHERE id_Cita = @id_Cita;

        -- Decrement Lote quantity
        UPDATE dbo.Lote
        SET CantidadDisponible = CantidadDisponible - 1
        WHERE id_LoteVacuna = @id_LoteAplicado;

        -- Insert into HistoricoVacunas and capture the new ID
        DECLARE @New_id_Historico INT;

        -- Including EdadRegistroMeses now as requested
        INSERT INTO dbo.HistoricoVacunas (
            id_Nino,
            id_Cita,
            FechaAplicacion,
            DosisAplicada,
            EdadAlMomento,
            EdadRegistroMeses, 
            VacunaNombre,
            FabricanteNombre,
            LoteNumero,
            PersonalSaludNombre,
            FirmaDigital,
            NotasAdicionales,
            Alergias
        )
        VALUES (
            @id_Nino,
            @id_Cita,
            @FechaAplicacion,
            @DosisAplicada,
            @EdadAlMomento,
            @EdadRegistroMeses,
            @VacunaNombre,
            @FabricanteNombre,
            @LoteNumero,
            @NombreCompletoPersonalAplicado,
            NULL,
            @NotasAdicionales,
            @Alergias
        );


        SET @New_id_Historico = SCOPE_IDENTITY();

        -- Now, insert into the bridge table HistoricoCita
        INSERT INTO dbo.HistoricoCita (
            id_Historico,
            id_Cita,
            Vacuna,
            NombreCompletoPersonal,
            CentroMedico,
            Fecha,
            Hora,
            Notas
        )
        SELECT
            @New_id_Historico,
            @id_Cita,
            @VacunaNombre,
            @NombreCompletoPersonalAplicado,
            cm.NombreCentro,
            c.Fecha,
            c.Hora,
            @NotasAdicionales
        FROM dbo.CitaVacunacion c
        JOIN dbo.CentroVacunacion cm ON c.id_CentroVacunacion = cm.id_CentroVacunacion
        WHERE c.id_Cita = @id_Cita;

        COMMIT TRANSACTION;
        SET @OutputMessage = 'Vaccination recorded successfully for Appointment ID: ' + CAST(@id_Cita AS NVARCHAR(10)) + '.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @OutputMessage = 'Error recording vaccination: ' + ERROR_MESSAGE() + ' (Procedure: ' + ERROR_PROCEDURE() + ', Line: ' + CAST(ERROR_LINE() AS NVARCHAR(10)) + ')';
        THROW;
        RETURN;
    END CATCH
END;
GO

PRINT 'Stored Procedure usp_RecordVaccination created/updated successfully.';
GO
