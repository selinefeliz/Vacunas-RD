-- =============================================
-- Description: Retrieves upcoming appointments for the admin dashboard.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[usp_GetDashboardAppointments]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 5
        c.id_Cita AS id,
        n.Nombres + ' ' + n.Apellidos as patient,
        v.Nombre as vaccine,
        LEFT(CAST(c.Hora AS NVARCHAR), 5) as time,
        cv.NombreCentro as center
    FROM 
        CitaVacunacion c
    JOIN 
        Nino n ON c.id_Nino = n.id_Nino
    JOIN 
        Vacuna v ON c.id_Vacuna = v.id_Vacuna
    JOIN 
        CentroVacunacion cv ON c.id_CentroVacunacion = cv.id_CentroVacunacion
    WHERE 
        c.Fecha = CAST(GETDATE() AS DATE)
    AND 
        c.id_EstadoCita = (SELECT id_Estado FROM EstadoCita WHERE Estado = 'Programada')
    ORDER BY 
        c.Hora ASC;
END
GO
