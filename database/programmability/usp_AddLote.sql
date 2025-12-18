-- =============================================
-- Author:      Cascade
-- Create date: 2025-06-14
-- Description: Registra un nuevo lote de vacunas en el inventario de un centro de vacunación.
-- =============================================
CREATE PROCEDURE usp_AddLote
    @id_VacunaCatalogo INT,
    @id_CentroVacunacion INT,
    @NumeroLote NVARCHAR(100),
    @FechaCaducidad DATE,
    @CantidadInicial INT
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON;

    -- Validaciones básicas
    IF @id_VacunaCatalogo IS NULL OR @id_CentroVacunacion IS NULL OR @NumeroLote IS NULL OR @CantidadInicial IS NULL
    BEGIN
        RAISERROR('Todos los parámetros son obligatorios.', 16, 1);
        RETURN;
    END

    IF @CantidadInicial <= 0
    BEGIN
        RAISERROR('La cantidad inicial debe ser un número positivo.', 16, 1);
        RETURN;
    END

    -- Verificar que la vacuna y el centro existen
    IF NOT EXISTS (SELECT 1 FROM dbo.Vacuna WHERE id_Vacuna = @id_VacunaCatalogo)
    BEGIN
        RAISERROR('El tipo de vacuna especificado no existe.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.CentroVacunacion WHERE id_CentroVacunacion = @id_CentroVacunacion)
    BEGIN
        RAISERROR('El centro de vacunación especificado no existe.', 16, 1);
        RETURN;
    END

    -- Insertar el nuevo lote en la tabla
    INSERT INTO dbo.Lote (
        id_VacunaCatalogo,
        id_CentroVacunacion,
        NumeroLote,
        FechaCaducidad,
        CantidadInicial,
        CantidadDisponible
    )
    VALUES (
        @id_VacunaCatalogo,
        @id_CentroVacunacion,
        @NumeroLote,
        @FechaCaducidad,
        @CantidadInicial,
        @CantidadInicial -- La cantidad disponible es igual a la inicial al registrar
    );

    -- Opcional: Devolver el ID del lote recién creado
    SELECT SCOPE_IDENTITY() AS NuevoLoteID;

END
GO
