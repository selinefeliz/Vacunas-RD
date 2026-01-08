ALTER PROCEDURE [dbo].[usp_GetMedicosByCentro]
    @id_CentroVacunacion INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Unir médicos del centro principal y de la tabla MedicoCentro
    SELECT 
        u.id_Usuario,
        COALESCE(u.Nombre + ' ' + u.Apellido, u.Email) AS NombreCompleto,
        u.Nombre,
        u.Apellido,
        u.Email
    FROM dbo.Usuario u
    WHERE u.id_Rol = 2 -- Médico
        AND u.id_Estado = 1 -- Activo
        AND u.id_CentroVacunacion = @id_CentroVacunacion;
END
GO
