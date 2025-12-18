SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[usp_CreateVaccinationCenter]
    @NombreCentro NVARCHAR(100),
    @Direccion NVARCHAR(200),
    @id_Provincia NVARCHAR(10), -- Changed from INT but kept name for compatibility
    @id_Municipio NVARCHAR(10), -- Changed from INT but kept name for compatibility
    @Telefono NVARCHAR(20),
    @Director NVARCHAR(100),
    @Web NVARCHAR(100),
    @Capacidad INT,
    @id_Estado INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @real_id_Provincia INT;
    DECLARE @real_id_Municipio INT;

    -- Resolve ids from codes
    SELECT @real_id_Provincia = id_Provincia FROM Provincia WHERE CodigoONE = @id_Provincia;
    
    IF @real_id_Provincia IS NULL
    BEGIN
        DECLARE @msgProv NVARCHAR(200) = 'No se encontró la provincia con código: ' + @id_Provincia;
        RAISERROR(@msgProv, 16, 1);
        RETURN;
    END

    SELECT @real_id_Municipio = id_Municipio FROM Municipio WHERE CodigoONE = @id_Municipio AND id_Provincia = @real_id_Provincia;

    IF @real_id_Municipio IS NULL
    BEGIN
        DECLARE @msgMuni NVARCHAR(200) = 'No se encontró el municipio con código: ' + @id_Municipio + ' para la provincia: ' + @id_Provincia;
        RAISERROR(@msgMuni, 16, 1);
        RETURN;
    END

    INSERT INTO CentroVacunacion (
        NombreCentro, Direccion, Telefono, Director, Web, 
        Capacidad, id_Estado, id_Provincia, id_Municipio
    )
    VALUES (
        @NombreCentro, @Direccion, @Telefono, @Director, @Web, 
        @Capacidad, @id_Estado, @real_id_Provincia, @real_id_Municipio
    );

    SELECT SCOPE_IDENTITY() AS id_CentroVacunacion;
END
GO
