CREATE OR ALTER PROCEDURE [dbo].[usp_UpdateAdminUser]
    @id_Usuario INT,
    @id_Rol INT,
    @id_Estado INT,
    @Cedula_Usuario NVARCHAR(15),
    @Email NVARCHAR(100),
    @id_CentroVacunacion INT = NULL,
    @Nombre NVARCHAR(100) = NULL,
    @Apellido NVARCHAR(100) = NULL,
    @additionalCenters [dbo].[MedicoCentrosType] READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Check for duplicate user (excluding current user)
    IF EXISTS (SELECT 1 FROM Usuario WHERE (Email = @Email OR Cedula_Usuario = @Cedula_Usuario) AND id_Usuario <> @id_Usuario)
    BEGIN
        RAISERROR('Another user with the provided Email or Cedula already exists.', 16, 1);
        RETURN;
    END

    -- 2. Business Logic Validation (similar to Create)
    IF (@id_Rol = 6 OR @id_Rol = 3 OR @id_Rol = 2) AND @id_CentroVacunacion IS NULL
    BEGIN
        -- Medico (2), Enfermera (3), Personal (6) require a center
        -- Actually, strictly speaking, frontend might handle this, but good to enforce here.
        RAISERROR('A Vaccination Center must be assigned for this user role.', 16, 1);
        RETURN;
    END
    
    -- 3. Update main User Record
    UPDATE Usuario
    SET
        id_Rol = @id_Rol,
        id_Estado = @id_Estado,
        Cedula_Usuario = @Cedula_Usuario,
        Email = @Email,
        id_CentroVacunacion = @id_CentroVacunacion,
        Nombre = ISNULL(@Nombre, Nombre), -- Update if provided, else keep existing
        Apellido = ISNULL(@Apellido, Apellido)
    WHERE
        id_Usuario = @id_Usuario;

    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('User not found.', 16, 1);
        RETURN;
    END

    -- 4. Handle Additional Centers
    -- First, remove existing additional centers for this user
    DELETE FROM UsuarioCentro WHERE id_Usuario = @id_Usuario;

    -- Then insert the new list
    IF EXISTS (SELECT 1 FROM @additionalCenters)
    BEGIN
        INSERT INTO UsuarioCentro (id_Usuario, id_Centro)
        SELECT @id_Usuario, id_Centro
        FROM @additionalCenters;
    END
END
GO
