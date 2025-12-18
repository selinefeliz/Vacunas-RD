CREATE OR ALTER PROCEDURE usp_GetDashboardStats
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(*) FROM Nino) AS totalPatients,
        (SELECT COUNT(*) FROM CitaVacunacion WHERE Fecha = CAST(GETDATE() AS DATE)) AS todayAppointments,
        (SELECT COUNT(*) FROM HistoricoVacunas) AS completedVaccinations,
        (SELECT COUNT(*) FROM Lote WHERE CantidadDisponible < 50) AS pendingAlerts;
END
GO
