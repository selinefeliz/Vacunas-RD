-- =============================================
-- Description: Retrieves alerts for the admin dashboard.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[usp_GetDashboardAlerts]
AS
BEGIN
    SET NOCOUNT ON;

    -- Inventory alerts: low stock
    SELECT 
        'warning' as type,
        'Bajo inventario: ' + v.Nombre + ' en ' + cv.NombreCentro + ' (' + CAST(l.CantidadDisponible AS NVARCHAR) + ' dosis)' as message,
        'high' as priority
    FROM 
        Lote l
    JOIN 
        Vacuna v ON l.id_VacunaCatalogo = v.id_Vacuna
    JOIN 
        CentroVacunacion cv ON l.id_CentroVacunacion = cv.id_CentroVacunacion
    WHERE 
        l.CantidadDisponible < 50

    UNION ALL

    -- Expiring Soon Alerts (30 days)
    SELECT 
        'info' as type,
        'Lote próximo a vencer: ' + v.Nombre + ' (Vence: ' + CONVERT(NVARCHAR, l.FechaCaducidad, 103) + ')' as message,
        'medium' as priority
    FROM 
        Lote l
    JOIN 
        Vacuna v ON l.id_VacunaCatalogo = v.id_Vacuna
    WHERE 
        l.FechaCaducidad BETWEEN GETDATE() AND DATEADD(day, 30, GETDATE())
    AND 
        l.CantidadDisponible > 0;
END
GO
