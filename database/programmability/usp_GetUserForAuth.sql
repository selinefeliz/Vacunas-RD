CREATE OR ALTER PROCEDURE [dbo].[usp_GetUserForAuth]
    @LoginIdentifier NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        u.id_Usuario,
        u.Email,
        u.Username, -- New column included in select
        u.Cedula_Usuario,
        u.Nombre,   -- New column included in select
        u.Apellido, -- New column included in select
        u.Clave,
        u.id_Rol,
        r.Rol AS NombreRol,
        u.id_Estado AS id_EstadoUsuario,
        es.Estado AS NombreEstado,
        u.id_CentroVacunacion
    FROM 
        dbo.Usuario u
    INNER JOIN 
        Rol r ON u.id_Rol = r.id_Rol
    INNER JOIN
        EstadoUsuario es ON u.id_Estado = es.id_Estado
    WHERE 
        (u.Email = @LoginIdentifier OR u.Cedula_Usuario = @LoginIdentifier OR u.Username = @LoginIdentifier)
        AND u.id_Estado = 1;

END;
GO
