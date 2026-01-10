CREATE OR ALTER PROCEDURE dbo.usp_CreatePatientHistory
    @id_Usuario INT,
    @id_Nino INT = NULL,
    @FechaNacimiento DATE,
    @Alergias NVARCHAR(MAX) = '',
    @NotasAdicionales NVARCHAR(MAX) = '',
    @OutputMessage NVARCHAR(MAX) OUTPUT,
    @Success BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validate id_Nino is provided
        IF @id_Nino IS NULL
        BEGIN
            SET @Success = 0;
            SET @OutputMessage = 'El ID del niño es requerido.';
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Check if child exists
        IF NOT EXISTS (SELECT 1 FROM dbo.Nino WHERE id_Nino = @id_Nino)
        BEGIN
            SET @Success = 0;
            SET @OutputMessage = 'El niño especificado no existe.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        /* 
           REMOVED: Strict Tutor validation. 
           This SP is used by Medical Staff who should be able to init history 
           regardless of the User ID passed (which might be the Tutor or the Doctor).
           Authentication checks are done at the API level.
        */
        
        -- Update child's medical information in Nino table
        -- This serves as the "medical history" - one record per patient
        UPDATE dbo.Nino
        SET 
            FechaNacimiento = @FechaNacimiento,
            Alergias = @Alergias,
            NotasAdicionales = @NotasAdicionales
        WHERE id_Nino = @id_Nino;

        -- Also update/insert into HistoricoMedico as requested (Redundancy)
        MERGE dbo.HistoricoMedico AS target
        USING (SELECT @id_Nino AS id_Nino) AS source
        ON (target.id_Nino = source.id_Nino)
        WHEN MATCHED THEN
            UPDATE SET 
                Alergias = @Alergias,
                NotasAdicionales = @NotasAdicionales,
                FechaActualizacion = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (id_Nino, Alergias, NotasAdicionales, FechaCreacion, FechaActualizacion)
            VALUES (@id_Nino, @Alergias, @NotasAdicionales, GETDATE(), GETDATE());
        
        SET @Success = 1;
        SET @OutputMessage = 'Historial médico guardado exitosamente.';
        
        COMMIT TRANSACTION;
        
        -- Return the Nino ID as the history ID
        SELECT @id_Nino AS id_Historico;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SET @Success = 0;
        SET @OutputMessage = 'Error al crear el historial médico: ' + ERROR_MESSAGE();
        
        -- Re-raise the error for logging purposes
        THROW;
    END CATCH
END
GO



