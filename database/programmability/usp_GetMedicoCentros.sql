CREATE OR ALTER PROCEDURE [dbo].[usp_GetMedicoCentros]
    @id_Usuario INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Combine primary center (from Usuario table) and additional centers (from UsuarioCentro table)
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

    UNION

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
        uc.id_Usuario = @id_Usuario
    -- Filter out the primary center if it appears in the junction table (though it shouldn't ideally)
    AND cv.id_CentroVacunacion NOT IN (SELECT id_CentroVacunacion FROM dbo.Usuario WHERE id_Usuario = @id_Usuario AND id_CentroVacunacion IS NOT NULL);
END
GO
