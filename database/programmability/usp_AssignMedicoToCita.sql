CREATE PROCEDURE [dbo].[usp_AssignMedicoToCita]
    @id_Cita INT,
    @id_PersonalSalud INT,
    @id_CentroVacunacion INT,
    @OutputMessage NVARCHAR(255) OUTPUT,
    @Success BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validar que la cita exista y pertenezca al centro de vacunación del personal
        IF NOT EXISTS (
            SELECT 1
            FROM dbo.CitaVacunacion
            WHERE id_Cita = @id_Cita AND id_CentroVacunacion = @id_CentroVacunacion
        )
        BEGIN
            SET @Success = 0;
            SET @OutputMessage = 'La cita no existe o no pertenece al centro de vacunación del personal.';
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Validar que el médico (id_PersonalSalud) pertenezca al centro de vacunación (principal o adicional)
        DECLARE @IsMedicoInCenter BIT;

        SELECT TOP 1 @IsMedicoInCenter = 1
        FROM dbo.Usuario u
        WHERE u.id_Usuario = @id_PersonalSalud
          AND u.id_Rol = 2 -- Médico
          AND u.id_Estado = 1 -- Activo
          AND (
              u.id_CentroVacunacion = @id_CentroVacunacion -- Centro Principal
              OR EXISTS ( -- Centro Adicional
                  SELECT 1
                  FROM dbo.MedicoCentro mc
                  WHERE mc.id_Usuario = u.id_Usuario
                    AND mc.id_CentroVacunacion = @id_CentroVacunacion
              )
          );

        IF @IsMedicoInCenter IS NULL
        BEGIN
            SET @Success = 0;
            SET @OutputMessage = 'El médico no pertenece al centro de vacunación especificado o no está activo.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Actualizar la cita SOLO con el médico asignado
        UPDATE dbo.CitaVacunacion 
        SET 
            id_PersonalSalud = @id_PersonalSalud
        WHERE id_Cita = @id_Cita;
        
        COMMIT TRANSACTION;
        
        SET @Success = 1;
        SET @OutputMessage = 'Médico asignado exitosamente a la cita.';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SET @Success = 0;
        SET @OutputMessage = 'Error al asignar médico: ' + ERROR_MESSAGE();
    END CATCH
END
GO
