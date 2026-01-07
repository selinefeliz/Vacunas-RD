-- V6: Alters usp_ScheduleAppointment to correctly handle NULL id_Nino
ALTER PROCEDURE [dbo].[usp_ScheduleAppointment]
    @id_Nino INT,
    @id_Vacuna INT,
    @id_CentroVacunacion INT,
    @Fecha DATE,
    @Hora TIME,
    @id_UsuarioRegistraCita INT,
    @RequiereTutor BIT,
    @OutputMessage NVARCHAR(255) OUTPUT,
    @New_id_Cita INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if the child exists, ONLY IF id_Nino is provided
    IF @id_Nino IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Nino WHERE id_Nino = @id_Nino)
    BEGIN
        RAISERROR('Error: Specified Nino (Child) ID does not exist.', 16, 1);
        RETURN;
    END

    -- Check if the user registering the appointment exists
    IF NOT EXISTS (SELECT 1 FROM Usuario WHERE id_Usuario = @id_UsuarioRegistraCita)
    BEGIN
        RAISERROR('Error: The user registering the appointment does not exist.', 16, 1);
        RETURN;
    END

    -- Check if vaccine exists
    IF NOT EXISTS (SELECT 1 FROM Vacuna WHERE id_Vacuna = @id_Vacuna)
    BEGIN
        RAISERROR('Error: Specified Vaccine ID does not exist.', 16, 1);
        RETURN;
    END

    -- Check if vaccination center exists
    IF NOT EXISTS (SELECT 1 FROM CentroVacunacion WHERE id_CentroVacunacion = @id_CentroVacunacion)
    BEGIN
        RAISERROR('Error: Specified Vaccination Center ID does not exist.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        INSERT INTO Citas (id_Nino, id_Vacuna, id_CentroVacunacion, Fecha, Hora, id_UsuarioRegistraCita, id_EstadoCita, RequiereTutor)
        VALUES (@id_Nino, @id_Vacuna, @id_CentroVacunacion, @Fecha, @Hora, @id_UsuarioRegistraCita, 1, @RequiereTutor); -- Assuming 1 is 'Scheduled'

        SET @New_id_Cita = SCOPE_IDENTITY();
        SET @OutputMessage = 'Appointment scheduled successfully.';
    END TRY
    BEGIN CATCH
        SET @New_id_Cita = NULL;
        SET @OutputMessage = ERROR_MESSAGE();
        -- Optional: re-throw the error to be caught by the client application
        THROW;
    END CATCH
END;
