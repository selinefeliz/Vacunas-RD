-- =============================================
-- Author:      Cascade
-- Create date: 2025-06-14
-- Description: Robustly creates a new user from the admin panel.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[usp_CreateAdminUser]
    @id_Rol INT,
    @Cedula_Usuario NVARCHAR(15),
    @Nombre NVARCHAR(100),
    @Apellido NVARCHAR(100),
    @Email NVARCHAR(100),
    @Clave NVARCHAR(255), -- Pre-hashed password
    @id_CentroVacunacion INT = NULL,
    @additionalCenters [dbo].[MedicoCentrosType] READONLY
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 1. Validate input parameters are not null or empty
    IF @id_Rol IS NULL OR ISNULL(@Cedula_Usuario, '') = '' OR ISNULL(@Email, '') = '' OR ISNULL(@Clave, '') = ''
    BEGIN
        RAISERROR('Input parameters (Role, Cedula, Email, Password) cannot be null or empty.', 16, 1);
        RETURN;
    END

    -- 2. Check for duplicate user
    IF EXISTS (SELECT 1 FROM Usuario WHERE Email = @Email OR Cedula_Usuario = @Cedula_Usuario)
    BEGIN
        RAISERROR('A user with the provided Email or Cedula already exists.', 16, 1);
        RETURN;
    END

    -- 3. Validate Foreign Key: id_Rol
    IF NOT EXISTS (SELECT 1 FROM Rol WHERE id_Rol = @id_Rol)
    BEGIN
        RAISERROR('The specified Role ID does not exist.', 16, 1);
        RETURN;
    END

    -- 4. Business Rule: if role is 'Personal' (ID 6), center must be provided.
    IF @id_Rol = 6 AND @id_CentroVacunacion IS NULL
    BEGIN
        RAISERROR('A Vaccination Center must be assigned for this user role.', 16, 1);
        RETURN;
    END

    -- 5. Validate Foreign Key: id_CentroVacunacion (only if it's not null)
    IF @id_CentroVacunacion IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CentroVacunacion WHERE id_CentroVacunacion = @id_CentroVacunacion)
    BEGIN
        RAISERROR('The specified Primary Vaccination Center ID does not exist.', 16, 1);
        RETURN;
    END

    -- All checks passed, proceed with insert
    INSERT INTO Usuario (id_Rol, id_Estado, Cedula_Usuario, Email, Clave, id_CentroVacunacion, Nombre, Apellido)
    VALUES (@id_Rol, 1, @Cedula_Usuario, @Email, @Clave, @id_CentroVacunacion, @Nombre, @Apellido); -- Default state 1 = 'Activo'

    DECLARE @newUserId INT = SCOPE_IDENTITY();

    -- Handle additional centers if they exist (for Medico role usually)
    IF EXISTS (SELECT 1 FROM @additionalCenters)
    BEGIN
        INSERT INTO UsuarioCentro (id_Usuario, id_Centro)
        SELECT @newUserId, id_Centro
        FROM @additionalCenters;
    END

    -- Return the ID of the newly created user
    SELECT @newUserId AS id_Usuario;
END
GO
