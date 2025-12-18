-- =============================================
-- Description: Retrieves all assigned centers for a medical user.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[usp_GetMedicoCentros]
    @id_Usuario INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Combine primary center and additional centers from Junction Table
    SELECT 
        cv.id_CentroVacunacion,
        cv.NombreCentro,
        cv.Direccion,
        'Principal' AS TipoAsignacion
    FROM 
        dbo.Usuario u
    JOIN 
        dbo.CentroVacunacion cv ON u.id_CentroVacunacion = cv.id_CentroVacunacion
    WHERE 
        u.id_Usuario = @id_Usuario

    UNION ALL

    SELECT 
        cv.id_CentroVacunacion,
        cv.NombreCentro,
        cv.Direccion,
        'Adicional' AS TipoAsignacion
    FROM 
        dbo.UsuarioCentro uc
    JOIN 
        dbo.CentroVacunacion cv ON uc.id_Centro = cv.id_CentroVacunacion
    WHERE 
        uc.id_Usuario = @id_Usuario;
END
GO
