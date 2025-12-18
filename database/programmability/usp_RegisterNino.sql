PRINT 'Creating Stored Procedure usp_RegisterNino...';
GO

IF OBJECT_ID('dbo.usp_RegisterNino', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_RegisterNino;
END
SET QUOTED_IDENTIFIER ON;
GO

CREATE PROCEDURE dbo.usp_RegisterNino
    -- Child details
    @Nombres_Nino NVARCHAR(100),
    @Apellidos_Nino NVARCHAR(100),
    @FechaNacimiento_Nino DATE,
    @Genero_Nino CHAR(1),
    @CodigoIdentificacionPropio_Nino NVARCHAR(20) = NULL,
    @Email_Nino NVARCHAR(100) = NULL,
    @DireccionResidencia_Nino NVARCHAR(200) = NULL,
    @PaisNacimiento_Nino NVARCHAR(100) = NULL,
    @id_CentroSaludAsignado_Nino INT = NULL,
    
    -- Tutor linking
    @id_Tutor INT,

    -- Optional User Account for Child
    @Email_Usuario_Nino NVARCHAR(100) = NULL, -- Login email for child's user account
    @Clave_Usuario_Nino NVARCHAR(255) = NULL, -- Hashed password for child's user account

    -- Output parameters
    @OutputMessage NVARCHAR(255) = NULL OUTPUT,
    @New_id_Nino INT = NULL OUTPUT,
    @New_id_Usuario_Nino INT = NULL OUTPUT -- Will be NULL if no user account is created for the child
AS
BEGIN
    SET NOCOUNT ON;
    SET @New_id_Usuario_Nino = NULL; -- Initialize output parameter

    -- Generate a default CodigoIdentificacionPropio if none provided (Activation Code)
    IF @CodigoIdentificacionPropio_Nino IS NULL OR @CodigoIdentificacionPropio_Nino = ''
    BEGIN
        SET @CodigoIdentificacionPropio_Nino = LEFT(REPLACE(NEWID(), '-', ''), 8);
    END

    DECLARE @id_Rol_Nino INT; -- Assuming a 'Nino' or 'Paciente' role might exist or be added
    DECLARE @id_Estado_Activo INT;
    DECLARE @id_Usuario_Tutor_Real INT;

    -- Obtener el id_Usuario del tutor para guardarlo en el registro del nino
    SELECT @id_Usuario_Tutor_Real = id_Usuario FROM dbo.Tutor WHERE id_Tutor = @id_Tutor;

    -- Validate Tutor exists
    IF NOT EXISTS (SELECT 1 FROM dbo.Tutor WHERE id_Tutor = @id_Tutor)
    BEGIN
        SET @OutputMessage = 'Error: Specified Tutor ID does not exist.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- Validate Genero
    IF @Genero_Nino NOT IN ('M', 'F', 'O')
    BEGIN
        SET @OutputMessage = 'Error: Invalid Gender specified. Must be M, F, or O.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    -- Check for existing child by CodigoIdentificacionPropio if provided
    IF @CodigoIdentificacionPropio_Nino IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Nino WHERE CodigoIdentificacionPropio = @CodigoIdentificacionPropio_Nino)
    BEGIN
        SET @OutputMessage = 'Error: Child with this CodigoIdentificacionPropio already exists.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;

    BEGIN TRY
        -- Create User account for Child if Email_Usuario_Nino and Clave_Usuario_Nino are provided
        IF @Email_Usuario_Nino IS NOT NULL AND @Clave_Usuario_Nino IS NOT NULL
        BEGIN
            -- Get ID for a generic 'Paciente' or 'Nino' role if it exists, or use a default/general role.
            -- For now, let's assume children might not have a specific role different from a general user or no role for direct login.
            -- This part might need adjustment based on how child user accounts are managed.
            -- Let's assume for now they get the same 'Tutor' role for simplicity, or a dedicated 'Child' role if created.
            -- For this example, we'll try to find a 'Paciente' role or default to a known general role if needed.
            -- This section needs refinement based on actual role structure for children users.
            -- For now, we'll assign role 5 ('Tutor') as a placeholder if we create a user. This should be reviewed.
            SELECT @id_Rol_Nino = id_Rol FROM dbo.Rol WHERE Rol = 'Tutor'; -- Placeholder, ideally 'Paciente' or similar
            IF @id_Rol_Nino IS NULL
            BEGIN
                SET @OutputMessage = 'Error: Default role for child user account not found.';
                RAISERROR(@OutputMessage, 16, 1);
                ROLLBACK TRANSACTION;
                RETURN;
            END

            SELECT @id_Estado_Activo = id_Estado FROM dbo.EstadoUsuario WHERE Estado = 'Activo';
            IF @id_Estado_Activo IS NULL
            BEGIN
                SET @OutputMessage = 'Error: User state ''Activo'' not found.';
                RAISERROR(@OutputMessage, 16, 1);
                ROLLBACK TRANSACTION;
                RETURN;
            END

            IF EXISTS (SELECT 1 FROM dbo.Usuario WHERE Email = @Email_Usuario_Nino)
            BEGIN
                SET @OutputMessage = 'Error: A user account with the child''s login Email already exists.';
                RAISERROR(@OutputMessage, 16, 1);
                ROLLBACK TRANSACTION;
                RETURN;
            END

            INSERT INTO dbo.Usuario (id_Rol, id_Estado, Email, Clave, Cedula_Usuario)
            VALUES (@id_Rol_Nino, @id_Estado_Activo, @Email_Usuario_Nino, @Clave_Usuario_Nino, @CodigoIdentificacionPropio_Nino); -- Using child's code as Cedula_Usuario

            SET @New_id_Usuario_Nino = SCOPE_IDENTITY();
        END

        -- Insert into Nino table
        INSERT INTO dbo.Nino (
            id_Usuario, Nombres, Apellidos, FechaNacimiento, Genero, 
            Email, DireccionResidencia, CodigoIdentificacionPropio, PaisNacimiento, id_CentroSaludAsignado, id_Usuario_Tutor
        )
        VALUES (
            @New_id_Usuario_Nino, -- This will be NULL if no user account was created for the child
            @Nombres_Nino, @Apellidos_Nino, @FechaNacimiento_Nino, @Genero_Nino, 
            @Email_Nino, @DireccionResidencia_Nino, @CodigoIdentificacionPropio_Nino, @PaisNacimiento_Nino, @id_CentroSaludAsignado_Nino, @id_Usuario_Tutor_Real
        );

        SET @New_id_Nino = SCOPE_IDENTITY();

        -- Link Tutor to Nino
        INSERT INTO dbo.TutorNino (id_Tutor, id_Nino)
        VALUES (@id_Tutor, @New_id_Nino);

        COMMIT TRANSACTION;
        SET @OutputMessage = 'Nino registered successfully. Nino ID: ' + CAST(@New_id_Nino AS NVARCHAR(10)) +
                             ISNULL(', User Account ID: ' + CAST(@New_id_Usuario_Nino AS NVARCHAR(10)), '') + '.';

        -- Return the newly created data as a result set for the backend
        SELECT 
            @New_id_Nino AS id_Nino, 
            @New_id_Usuario_Nino AS id_Usuario_Nino, 
            @CodigoIdentificacionPropio_Nino AS ActivationCode;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @OutputMessage = 'Error registering Nino: ' + ERROR_MESSAGE() + ' (Procedure: ' + ERROR_PROCEDURE() + ', Line: ' + CAST(ERROR_LINE() AS NVARCHAR(10)) + ')';
        THROW;
        RETURN;
    END CATCH
END;
GO

PRINT 'Stored Procedure usp_RegisterNino created/updated successfully.';
GO
