PRINT 'Creating Stored Procedure usp_GetNinosDetalladosPorTutor...';
GO

IF OBJECT_ID('dbo.usp_GetNinosDetalladosPorTutor', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_GetNinosDetalladosPorTutor;
END
GO

CREATE PROCEDURE dbo.usp_GetNinosDetalladosPorTutor
    @id_Usuario INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Obtener el id_Tutor asociado al id_Usuario
    DECLARE @id_Tutor INT;
    SELECT @id_Tutor = id_Tutor FROM dbo.Tutor WHERE id_Usuario = @id_Usuario;

    IF @id_Tutor IS NULL
    BEGIN
        -- Si no es un tutor, devolvemos conjunto vacío
        RETURN;
    END

    SELECT 
        n.id_Nino,
        n.Nombres,
        n.Apellidos,
        n.FechaNacimiento,
        dbo.fn_CalculateAge(n.FechaNacimiento, GETDATE()) AS EdadActual,
        n.Genero,
        n.CodigoIdentificacionPropio,
        n.PaisNacimiento,
        c.NombreCentro AS CentroSaludAsignado
    FROM 
        dbo.Nino n
    JOIN 
        dbo.TutorNino tn ON n.id_Nino = tn.id_Nino
    LEFT JOIN 
        dbo.CentroVacunacion c ON n.id_CentroSaludAsignado = c.id_CentroVacunacion
    WHERE 
        tn.id_Tutor = @id_Tutor
    ORDER BY 
        n.Nombres ASC;
END;
GO

PRINT 'Stored Procedure usp_GetNinosDetalladosPorTutor created successfully.';
GO
