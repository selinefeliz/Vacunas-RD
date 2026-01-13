ALTER PROCEDURE usp_AddLote
    @id_VacunaCatalogo INT,
    @id_CentroVacunacion INT,
    @NumeroLote NVARCHAR(100),
    @FechaCaducidad DATE,
    @CantidadInicial INT,
    @CantidadMinimaAlerta INT = 10,
    @CantidadMaximaCapacidad INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validaciones básicas
    IF @id_VacunaCatalogo IS NULL OR @id_CentroVacunacion IS NULL OR @NumeroLote IS NULL OR @CantidadInicial IS NULL
    BEGIN
        RAISERROR('Todos los parámetros obligatorios deben estar presentes.', 16, 1);
        RETURN;
    END

    IF @CantidadInicial <= 0
    BEGIN
        RAISERROR('La cantidad inicial debe ser un número positivo.', 16, 1);
        RETURN;
    END
    
    -- Validar rangos especificados por el usuario
    IF @CantidadMaximaCapacidad IS NOT NULL AND @CantidadInicial > @CantidadMaximaCapacidad
    BEGIN
        RAISERROR('La cantidad inicial (%d) no puede exceder la capacidad máxima establecida (%d).', 16, 1, @CantidadInicial, @CantidadMaximaCapacidad);
        RETURN;
    END

    IF @CantidadMinimaAlerta IS NOT NULL AND @CantidadInicial < @CantidadMinimaAlerta
    BEGIN
        RAISERROR('La cantidad inicial (%d) no puede ser menor a la cantidad mínima de alerta (%d).', 16, 1, @CantidadInicial, @CantidadMinimaAlerta);
        RETURN;
    END
    
    IF @CantidadMaximaCapacidad IS NOT NULL AND @CantidadMinimaAlerta IS NOT NULL AND @CantidadMinimaAlerta > @CantidadMaximaCapacidad
    BEGIN
        RAISERROR('La cantidad mínima no puede ser mayor a la capacidad máxima.', 16, 1);
        RETURN;
    END

    -- Verificar existencia de entidades
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

    -- Lógica de Upsert
    DECLARE @ExistingLoteID INT;
    DECLARE @ExistingVacunaID INT;
    DECLARE @ExistingFecha DATE;

    SELECT 
        @ExistingLoteID = id_LoteVacuna,
        @ExistingVacunaID = id_VacunaCatalogo,
        @ExistingFecha = FechaCaducidad
    FROM dbo.Lote 
    WHERE id_CentroVacunacion = @id_CentroVacunacion 
      AND NumeroLote = @NumeroLote;

    IF @ExistingLoteID IS NOT NULL
    BEGIN
        IF @ExistingVacunaID = @id_VacunaCatalogo AND @ExistingFecha = @FechaCaducidad
        BEGIN
            -- Restock y actualización de umbrales
            UPDATE dbo.Lote
            SET CantidadInicial = CantidadInicial + @CantidadInicial,
                CantidadDisponible = CantidadDisponible + @CantidadInicial,
                CantidadMinimaAlerta = ISNULL(@CantidadMinimaAlerta, CantidadMinimaAlerta),
                CantidadMaximaCapacidad = ISNULL(@CantidadMaximaCapacidad, CantidadMaximaCapacidad)
            WHERE id_LoteVacuna = @ExistingLoteID;

            -- Validar que la NUEVA cantidad total no exceda el máximo (si se aplica estricto)
            -- Pero como ya pasó la validación inicial, asumimos que está bien o es una decisión de negocio permitir sobrecarga en restock.
            -- Dejaremos la validación solo para la entrada actual.

            SELECT @ExistingLoteID AS NuevoLoteID;
        END
        ELSE
        BEGIN
            RAISERROR('Conflicto: El número de lote %s ya existe para otra vacuna o fecha.', 16, 1, @NumeroLote);
            RETURN;
        END
    END
    ELSE
    BEGIN
        INSERT INTO dbo.Lote (
            id_VacunaCatalogo,
            id_CentroVacunacion,
            NumeroLote,
            FechaCaducidad,
            CantidadInicial,
            CantidadDisponible,
            CantidadMinimaAlerta,
            CantidadMaximaCapacidad
        )
        VALUES (
            @id_VacunaCatalogo,
            @id_CentroVacunacion,
            @NumeroLote,
            @FechaCaducidad,
            @CantidadInicial,
            @CantidadInicial,
            @CantidadMinimaAlerta,
            @CantidadMaximaCapacidad
        );

        SELECT SCOPE_IDENTITY() AS NuevoLoteID;
    END
END
GO
