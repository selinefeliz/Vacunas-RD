PRINT 'Creating Stored Procedure usp_AddVaccineLot...';
GO

IF OBJECT_ID('dbo.usp_AddVaccineLot', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_AddVaccineLot;
END
GO

CREATE PROCEDURE [dbo].[usp_AddVaccineLot]
    @id_VacunaCatalogo INT,
    @id_CentroVacunacion INT,
    @NumeroLote NVARCHAR(50),
    @FechaCaducidad DATE,
    @CantidadInicial INT,

    @OutputMessage NVARCHAR(255) OUTPUT,
    @New_id_LoteVacuna INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validations
    IF NOT EXISTS (SELECT 1 FROM dbo.Vacuna WHERE id_Vacuna = @id_VacunaCatalogo)
    BEGIN
        SET @OutputMessage = 'Error: Specified Vacuna (Vaccine Catalog) ID does not exist.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.CentroVacunacion WHERE id_CentroVacunacion = @id_CentroVacunacion) -- Added validation
    BEGIN
        SET @OutputMessage = 'Error: Specified CentroVacunacion (Vaccination Center) ID does not exist.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    IF @CantidadInicial < 0
    BEGIN
        SET @OutputMessage = 'Error: CantidadInicial (Initial Quantity) cannot be negative.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    IF @FechaCaducidad < GETDATE()
    BEGIN
        SET @OutputMessage = 'Error: FechaCaducidad (Expiration Date) cannot be in the past.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- Check if Lot already exists for this Center, Vaccine, Batch Number AND Expiration Date
    -- If it exists, we ADD to the existing stock instead of erroring.
    IF EXISTS (SELECT 1 FROM dbo.Lote WHERE id_CentroVacunacion = @id_CentroVacunacion AND id_VacunaCatalogo = @id_VacunaCatalogo AND NumeroLote = @NumeroLote AND FechaCaducidad = @FechaCaducidad)
    BEGIN
        BEGIN TRANSACTION;
        BEGIN TRY
            UPDATE dbo.Lote
            SET CantidadInicial = CantidadInicial + @CantidadInicial,
                CantidadDisponible = CantidadDisponible + @CantidadInicial
            WHERE id_CentroVacunacion = @id_CentroVacunacion 
              AND id_VacunaCatalogo = @id_VacunaCatalogo 
              AND NumeroLote = @NumeroLote
              AND FechaCaducidad = @FechaCaducidad;

            -- Get the ID of the updated lot
            SELECT @New_id_LoteVacuna = id_LoteVacuna
            FROM dbo.Lote 
            WHERE id_CentroVacunacion = @id_CentroVacunacion 
              AND id_VacunaCatalogo = @id_VacunaCatalogo 
              AND NumeroLote = @NumeroLote
              AND FechaCaducidad = @FechaCaducidad;

            COMMIT TRANSACTION;
            SET @OutputMessage = 'Vaccine lot stock updated successfully (Merged with existing lot). Lot ID: ' + CAST(@New_id_LoteVacuna AS NVARCHAR(10)) + '.';
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            
            DECLARE @UpdateErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
            SET @OutputMessage = 'Error updating existing vaccine lot: ' + @UpdateErrorMsg;
            RAISERROR(@OutputMessage, 16, 1);
            RETURN;
        END CATCH
    END
    ELSE
    BEGIN
        -- New Lot - Insert
        BEGIN TRANSACTION;
        BEGIN TRY
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
                @CantidadInicial 
            );

            SET @New_id_LoteVacuna = SCOPE_IDENTITY();

            COMMIT TRANSACTION;
            SET @OutputMessage = 'Vaccine lot added successfully. Lot ID: ' + CAST(@New_id_LoteVacuna AS NVARCHAR(10)) + '.';

        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

            DECLARE @CaughtErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
            SET @OutputMessage = 'Error adding vaccine lot: ' + @CaughtErrorMessage;
            
            -- Handle potential unique constraint violations not covered by our specific check (e.g. if we missed a column in the check but the constraint considers it)
            -- However, with the new logic, the most common duplication is handled. 
            IF ERROR_NUMBER() = 2627 
            BEGIN
                 SET @OutputMessage = 'Error: A lot with similar details exists but could not be merged. ' + @CaughtErrorMessage;
            END

            RAISERROR (@OutputMessage, 16, 1);
            RETURN;
        END CATCH
    END
END;
GO

PRINT 'Stored Procedure usp_AddVaccineLot created/updated successfully.';
GO
