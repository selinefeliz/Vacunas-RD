// Script to update usp_CreatePatientHistory to use Nino table
const sql = require('mssql');
require('dotenv').config({ path: '.env' });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
    },
    port: parseInt(process.env.DB_PORT) || 1433,
};

const spScript = `
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
        
        DECLARE @id_Tutor INT;
        
        -- Get the tutor ID from the user ID
        SELECT @id_Tutor = id_Tutor
        FROM dbo.Tutor
        WHERE id_Usuario = @id_Usuario;
        
        IF @id_Tutor IS NULL
        BEGIN
            SET @Success = 0;
            SET @OutputMessage = 'No se encontró un tutor asociado al usuario proporcionado.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Validate id_Nino is provided
        IF @id_Nino IS NULL
        BEGIN
            SET @Success = 0;
            SET @OutputMessage = 'El ID del niño es requerido.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Validate child belongs to tutor
        IF NOT EXISTS (
            SELECT 1 
            FROM dbo.TutorNino 
            WHERE id_Tutor = @id_Tutor AND id_Nino = @id_Nino
        )
        BEGIN
            SET @Success = 0;
            SET @OutputMessage = 'El niño no pertenece al tutor especificado.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Update child's medical information in Nino table
        -- This serves as the "medical history" - one record per patient
        UPDATE dbo.Nino
        SET 
            FechaNacimiento = @FechaNacimiento,
            Alergias = @Alergias,
            NotasAdicionales = @NotasAdicionales
        WHERE id_Nino = @id_Nino;
        
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
`;

async function updateStoredProcedure() {
    try {
        console.log('Connecting to database...');
        await sql.connect(config);
        console.log('Connected successfully.');

        console.log('Updating stored procedure usp_CreatePatientHistory...');
        await sql.query(spScript);
        console.log('✓ Stored procedure updated successfully!');

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    } finally {
        await sql.close();
    }
}

updateStoredProcedure();
