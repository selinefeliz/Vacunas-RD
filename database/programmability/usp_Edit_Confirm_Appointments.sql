CREATE OR ALTER PROCEDURE [dbo].[usp_EditAppointment]
    @id_Cita INT,
    @Fecha DATE,
    @Hora TIME,
    @id_PersonalSalud INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM dbo.CitaVacunacion WHERE id_Cita = @id_Cita)
    BEGIN
        RAISERROR('La cita no existe.', 16, 1);
        RETURN;
    END

    UPDATE dbo.CitaVacunacion
    SET Fecha = @Fecha,
        Hora = @Hora,
        id_PersonalSalud = @id_PersonalSalud,
        id_EstadoCita = (SELECT id_Estado FROM dbo.EstadoCita WHERE Estado = 'Agendada')
    WHERE id_Cita = @id_Cita;

    SELECT * FROM dbo.CitaVacunacion WHERE id_Cita = @id_Cita;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_ConfirmAppointment]
    @id_Cita INT,
    @id_PersonalSalud INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.CitaVacunacion WHERE id_Cita = @id_Cita)
    BEGIN
        RAISERROR('La cita no existe.', 16, 1);
        RETURN;
    END

    UPDATE dbo.CitaVacunacion
    SET id_PersonalSalud = @id_PersonalSalud,
        id_EstadoCita = (SELECT id_Estado FROM dbo.EstadoCita WHERE Estado = 'Confirmada')
    WHERE id_Cita = @id_Cita;

    SELECT * FROM dbo.CitaVacunacion WHERE id_Cita = @id_Cita;
END;
GO
