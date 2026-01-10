-- Add FechaNacimiento to Tutor table if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Tutor' AND COLUMN_NAME = 'FechaNacimiento')
BEGIN
    ALTER TABLE Tutor ADD FechaNacimiento DATE NULL;
END
GO

-- Update usp_RegisterTutor to include FechaNacimiento
CREATE OR ALTER PROCEDURE dbo.usp_RegisterTutor
    @Cedula_Tutor NVARCHAR(15),
    @Nombres_Tutor NVARCHAR(100),
    @Apellidos_Tutor NVARCHAR(100),
    @Telefono_Tutor NVARCHAR(20) = NULL,
    @Email_Tutor NVARCHAR(100) = NULL,
    @Direccion_Tutor NVARCHAR(200) = NULL,
    @FechaNacimiento DATE = NULL, -- New parameter
    @Email_Usuario NVARCHAR(100),
    @Clave_Usuario NVARCHAR(255),
    @Username NVARCHAR(100) = NULL,
    @OutputMessage NVARCHAR(255) OUTPUT,
    @New_id_Usuario INT OUTPUT,
    @New_id_Tutor INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id_Rol_Tutor INT;
    DECLARE @id_Estado_Activo INT;

    SELECT @id_Rol_Tutor = id_Rol FROM dbo.Rol WHERE Rol = 'Tutor';
    SELECT @id_Estado_Activo = id_Estado FROM dbo.EstadoUsuario WHERE Estado = 'Activo';

    -- Validaciones básicas
    IF EXISTS (SELECT 1 FROM dbo.Tutor WHERE Cedula_Tutor = @Cedula_Tutor)
    BEGIN
        SET @OutputMessage = 'Error: Cédula ya registrada.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM dbo.Usuario WHERE Email = @Email_Usuario)
    BEGIN
        SET @OutputMessage = 'Error: El correo de login ya existe.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    IF @Username IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Usuario WHERE Username = @Username)
    BEGIN
        SET @OutputMessage = 'Error: El nombre de usuario (Username) ya existe.';
        RAISERROR(@OutputMessage, 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Insert into Usuario table
        INSERT INTO dbo.Usuario (id_Rol, id_Estado, Email, Username, Clave, Cedula_Usuario, Nombre, Apellido)
        VALUES (@id_Rol_Tutor, @id_Estado_Activo, @Email_Usuario, @Username, @Clave_Usuario, @Cedula_Tutor, @Nombres_Tutor, @Apellidos_Tutor);

        SET @New_id_Usuario = SCOPE_IDENTITY();

        -- Insert into Tutor table WITH FechaNacimiento
        INSERT INTO dbo.Tutor (id_Usuario, Cedula_Tutor, Nombres, Apellidos, Telefono, Email, Direccion, FechaNacimiento)
        VALUES (@New_id_Usuario, @Cedula_Tutor, @Nombres_Tutor, @Apellidos_Tutor, @Telefono_Tutor, @Email_Tutor, @Direccion_Tutor, @FechaNacimiento);

        SET @New_id_Tutor = SCOPE_IDENTITY();

        COMMIT TRANSACTION;
        SET @OutputMessage = 'Registro exitoso.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
