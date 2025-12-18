PRINT 'Creating Stored Procedure usp_ScheduleAppointment...';
GO

IF OBJECT_ID('dbo.usp_ScheduleAppointment', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_ScheduleAppointment;
END
GO

CREATE PROCEDURE dbo.usp_ScheduleAppointment
    @id_Nino INT,
    @id_Vacuna INT,
    @id_CentroVacunacion INT,
    @Fecha DATE,
    @Hora TIME = NULL,
    @id_UsuarioRegistraCita INT,
    @RequiereTutor BIT = 0,

    @OutputMessage NVARCHAR(255) OUTPUT,
    @New_id_Cita INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id_EstadoCita_Agendada INT, @id_EstadoCanceladaCentro INT, @id_EstadoCanceladaPaciente INT;

    -- Get ID for 'Agendada' state
    SELECT @id_EstadoCita_Agendada = id_Estado FROM dbo.EstadoCita WHERE Estado = 'Agendada';
    SELECT @id_EstadoCanceladaCentro = id_Estado FROM dbo.EstadoCita WHERE Estado = 'Cancelada por Centro';
    SELECT @id_EstadoCanceladaPaciente = id_Estado FROM dbo.EstadoCita WHERE Estado = 'Cancelada por Paciente';

    IF @id_EstadoCita_Agendada IS NULL
    BEGIN
        SET @OutputMessage = 'Error: Appointment state ''Agendada'' not found. Please ensure initial data is populated.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- Validations
    IF @id_Nino IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Nino WHERE id_Nino = @id_Nino)
    BEGIN
        SET @OutputMessage = 'Error: Specified Nino (Child) ID does not exist.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.Vacuna WHERE id_Vacuna = @id_Vacuna)
    BEGIN
        SET @OutputMessage = 'Error: Specified Vacuna (Vaccine) ID does not exist.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.CentroVacunacion WHERE id_CentroVacunacion = @id_CentroVacunacion)
    BEGIN
        SET @OutputMessage = 'Error: Specified CentroVacunacion (Vaccination Center) ID does not exist.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_Usuario = @id_UsuarioRegistraCita)
    BEGIN
        SET @OutputMessage = 'Error: Specified Usuario (User registering appointment) ID does not exist.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    IF @Fecha < CAST(GETDATE() AS DATE)
    BEGIN
        SET @OutputMessage = 'Error: Appointment date cannot be in the past.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- Optional: Check for duplicate appointments (same child, same vaccine, same day)
    -- This logic can be adjusted based on specific business rules.
    IF EXISTS (SELECT 1 FROM dbo.CitaVacunacion 
               WHERE id_Nino = @id_Nino AND id_Vacuna = @id_Vacuna AND Fecha = @Fecha AND id_EstadoCita NOT IN (@id_EstadoCanceladaCentro, @id_EstadoCanceladaPaciente))
    BEGIN
        SET @OutputMessage = 'Error: An active appointment for this child, vaccine, and date already exists.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;

    BEGIN TRY
        INSERT INTO dbo.CitaVacunacion (
            id_Nino, id_Vacuna, id_UsuarioRegistraCita, id_CentroVacunacion, 
            Fecha, Hora, id_EstadoCita, RequiereTutor
        )
        VALUES (
            @id_Nino, @id_Vacuna, @id_UsuarioRegistraCita, @id_CentroVacunacion,
            @Fecha, @Hora, @id_EstadoCita_Agendada, @RequiereTutor
        );

        SET @New_id_Cita = SCOPE_IDENTITY();

        COMMIT TRANSACTION;
        SET @OutputMessage = 'Appointment scheduled successfully. Appointment ID: ' + CAST(@New_id_Cita AS NVARCHAR(10)) + '.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @OutputMessage = 'Error scheduling appointment: ' + ERROR_MESSAGE() + ' (Procedure: ' + ERROR_PROCEDURE() + ', Line: ' + CAST(ERROR_LINE() AS NVARCHAR(10)) + ')';
        THROW;
        RETURN;
    END CATCH
END;
GO

PRINT 'Stored Procedure usp_ScheduleAppointment created/updated successfully.';
GO
