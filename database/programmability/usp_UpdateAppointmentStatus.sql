PRINT 'Creating Stored Procedure usp_UpdateAppointmentStatus...';
GO

IF OBJECT_ID('dbo.usp_UpdateAppointmentStatus', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_UpdateAppointmentStatus;
END
GO

CREATE PROCEDURE dbo.usp_UpdateAppointmentStatus
    @id_Cita INT,
    @id_NuevoEstadoCita INT,
    @id_UsuarioModifica INT, -- User making the change
    @Notas NVARCHAR(MAX) = NULL, -- Optional notes for the status change

    @OutputMessage NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CurrentEstadoCitaId INT;
    DECLARE @NuevoEstadoCitaNombre NVARCHAR(50);
    DECLARE @CurrentEstadoCitaNombre NVARCHAR(50);
    DECLARE @id_EstadoAsistida INT, @id_EstadoCanceladaPaciente INT, @id_EstadoCanceladaCentro INT, @id_EstadoNoAsistio INT;

    -- Validate Cita exists
    SELECT @CurrentEstadoCitaId = cv.id_EstadoCita, @CurrentEstadoCitaNombre = ec.Estado 
    FROM dbo.CitaVacunacion cv
    JOIN dbo.EstadoCita ec ON cv.id_EstadoCita = ec.id_Estado
    WHERE cv.id_Cita = @id_Cita;

    IF @CurrentEstadoCitaId IS NULL
    BEGIN
        SET @OutputMessage = 'Error: Appointment ID ' + CAST(@id_Cita AS NVARCHAR(10)) + ' not found.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- Validate NuevoEstadoCita exists
    SELECT @NuevoEstadoCitaNombre = Estado FROM dbo.EstadoCita WHERE id_Estado = @id_NuevoEstadoCita;
    IF @NuevoEstadoCitaNombre IS NULL
    BEGIN
        SET @OutputMessage = 'Error: New Appointment State ID ' + CAST(@id_NuevoEstadoCita AS NVARCHAR(10)) + ' not found.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- Validate UsuarioModifica exists
    IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_Usuario = @id_UsuarioModifica)
    BEGIN
        SET @OutputMessage = 'Error: User ID ' + CAST(@id_UsuarioModifica AS NVARCHAR(10)) + ' (modifier) not found.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- Get IDs for terminal and special states
    SELECT @id_EstadoAsistida = id_Estado FROM dbo.EstadoCita WHERE Estado = 'Asistida';
    SELECT @id_EstadoCanceladaPaciente = id_Estado FROM dbo.EstadoCita WHERE Estado = 'Cancelada por Paciente';
    SELECT @id_EstadoCanceladaCentro = id_Estado FROM dbo.EstadoCita WHERE Estado = 'Cancelada por Centro';
    SELECT @id_EstadoNoAsistio = id_Estado FROM dbo.EstadoCita WHERE Estado = 'No Asistio';

    -- Business logic for state transitions using IDs
    IF @CurrentEstadoCitaId IN (@id_EstadoAsistida, @id_EstadoCanceladaPaciente, @id_EstadoCanceladaCentro, @id_EstadoNoAsistio)
    BEGIN
        -- Allow changing notes even if status is final, but not the status itself.
        -- This check prevents changing from a terminal state to any other state.
        IF @CurrentEstadoCitaId <> @id_NuevoEstadoCita 
        BEGIN
            SET @OutputMessage = 'Error: Appointment is already in a terminal state (' + @CurrentEstadoCitaNombre + ') and its status cannot be changed to ' + @NuevoEstadoCitaNombre + '.';
            RAISERROR(@OutputMessage, 16, 1);
            RETURN;
        END
    END
    
    -- Prevent changing to 'Asistida' using this SP. usp_RecordVaccination should handle that.
    -- Prevent changing to 'Asistida' using this SP. usp_RecordVaccination should handle that.
    -- removed check for user experience
    /*
    IF @id_NuevoEstadoCita = @id_EstadoAsistida
    BEGIN
        SET @OutputMessage = 'Error: To mark an appointment as ''Asistida'', please use the usp_RecordVaccination procedure.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END
    */

    BEGIN TRANSACTION;

    BEGIN TRY
        UPDATE dbo.CitaVacunacion
        SET id_EstadoCita = @id_NuevoEstadoCita
        -- We might want a column for 'LastModifiedByUserId' and 'LastModifiedDate' in CitaVacunacion
        -- For now, this SP doesn't update such audit fields directly in CitaVacunacion table.
        WHERE id_Cita = @id_Cita;

        -- Log to HistoricoCita (if this is its intended purpose)
        -- The HistoricoCita table structure might need to be aligned with the data we want to log here.
        -- For example, it might need id_UsuarioModifica, id_EstadoAnterior, id_EstadoNuevo, FechaCambio, Notas.
        -- For now, we'll assume a simplified insert based on its current structure.
        -- NOTE: The INSERT into HistoricoCita has been removed.
        -- This table has been restructured to be a bridge between HistoricoVacunas and CitaVacunacion,
        -- exclusively for logging attended vaccination events.
        -- General status changes should be audited in a different table if required.
        -- The procedure to handle attended appointments (e.g., usp_RecordVaccination) is now responsible for inserting into HistoricoCita.
        /*
        INSERT INTO dbo.HistoricoCita (id_Cita, Vacuna, NombreCompletoPersonal, CentroMedico, Fecha, Hora, Notas)
        SELECT 
            @id_Cita,
            v.Nombre, -- Vacuna associated with the appointment
            u.Email, -- User who modified, or could be their full name if available
            cvc.NombreCentro, -- Centro associated with the appointment
            GETDATE(), -- Date of status change
            CAST(GETDATE() AS TIME), -- Time of status change
            'Status changed from ' + @CurrentEstadoCitaNombre + ' to ' + @NuevoEstadoCitaNombre + '. User: ' + CAST(@id_UsuarioModifica AS NVARCHAR(10)) + '. Notes: ' + ISNULL(@Notas, 'N/A')
        FROM dbo.CitaVacunacion c 
        JOIN dbo.Vacuna v ON c.id_Vacuna = v.id_Vacuna
        JOIN dbo.CentroVacunacion cvc ON c.id_CentroVacunacion = cvc.id_CentroVacunacion
        JOIN dbo.Usuario u ON u.id_Usuario = @id_UsuarioModifica
        WHERE c.id_Cita = @id_Cita;
        */

        COMMIT TRANSACTION;
        SET @OutputMessage = 'Appointment ID ' + CAST(@id_Cita AS NVARCHAR(10)) + ' status updated to ''' + @NuevoEstadoCitaNombre + ''' successfully.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @CaughtErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @CaughtErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @CaughtErrorState INT = ERROR_STATE();
        
        SET @OutputMessage = 'Error updating appointment status: ' + ISNULL(@CaughtErrorMessage, 'Unknown error');
        RAISERROR (@CaughtErrorMessage, @CaughtErrorSeverity, @CaughtErrorState);
        RETURN;
    END CATCH
END;
GO

PRINT 'Stored Procedure usp_UpdateAppointmentStatus created/updated successfully.';
GO
