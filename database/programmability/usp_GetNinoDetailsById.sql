PRINT 'Creating Stored Procedure usp_GetNinoDetailsById...';
GO

IF OBJECT_ID('dbo.usp_GetNinoDetailsById', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_GetNinoDetailsById;
END
GO

CREATE PROCEDURE dbo.usp_GetNinoDetailsById
    @id_Nino INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Nino WHERE id_Nino = @id_Nino)
    BEGIN
        PRINT 'Error: Nino with ID ' + CAST(@id_Nino AS VARCHAR(10)) + ' not found.';
        -- Return an empty result set or RAISERROR, depending on desired API handling
        -- For now, returning an empty result set might be simpler for API to check.
        RETURN;
    END

    SELECT 
        n.id_Nino,
        n.Nombres,
        n.Apellidos,
        n.FechaNacimiento,
        dbo.fn_CalculateAge(n.FechaNacimiento, GETDATE()) AS EdadActual,
        n.Genero,
        n.CodigoIdentificacionPropio AS CodigoIdentificacion,
        n.id_Usuario AS Nino_id_Usuario, -- Child's own user account ID, if any
        u_nino.Email AS NinoEmail, -- Child's own user account email, if any
        t.id_Tutor,
        t.Nombres AS TutorNombres,
        
        t.Apellidos AS TutorApellidos,
        tut_u.Email AS TutorEmail,
        t.Telefono AS TutorTelefono
    FROM 
        dbo.Nino n
    JOIN 
        dbo.TutorNino tn ON n.id_Nino = tn.id_Nino
    JOIN 
        dbo.Tutor t ON tn.id_Tutor = t.id_Tutor
    JOIN 
        dbo.Usuario tut_u ON t.id_Usuario = tut_u.id_Usuario
    LEFT JOIN
        dbo.Usuario u_nino ON n.id_Usuario = u_nino.id_Usuario -- Left join for child's optional user account
    WHERE 
        n.id_Nino = @id_Nino;

END;
GO

PRINT 'Stored Procedure usp_GetNinoDetailsById created/updated successfully.';
GO

-- Example Usage:
/*
-- Assuming a Nino with ID 1 exists:
EXEC dbo.usp_GetNinoDetailsById @id_Nino = 1;

-- Assuming a Nino with ID 999 does not exist:
EXEC dbo.usp_GetNinoDetailsById @id_Nino = 999;
*/
GO
