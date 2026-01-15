const sql = require('mssql');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

const SQL_FIX = `
CREATE OR ALTER PROCEDURE dbo.usp_GetAppointmentsByNino
    @id_Nino INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate Nino exists
    IF NOT EXISTS (SELECT 1 FROM dbo.Nino WHERE id_Nino = @id_Nino)
    BEGIN
        PRINT 'Error: Nino with ID ' + CAST(@id_Nino AS VARCHAR(10)) + ' not found.';
        RETURN;
    END

    SELECT 
        c.id_Cita,
        c.id_Vacuna, -- CRITICAL ADDITION
        c.Fecha, -- CRITICAL: No Alias (matches Interface)
        c.Hora, -- CRITICAL: No Alias (matches Interface)
        v.Nombre AS NombreVacuna,
        cvc.NombreCentro AS NombreCentroVacunacion,
        ec.Estado AS EstadoCita,
        c.NombreCompletoPersonalAplicado,
        l.NumeroLote AS LoteAplicadoNumero,
        l.FechaCaducidad AS LoteFechaCaducidad,
        u_registra.Email AS EmailUsuarioRegistraCita,
        u_personal.Email AS EmailPersonalSaludAsignado
    FROM 
        dbo.CitaVacunacion c
    JOIN 
        dbo.Vacuna v ON c.id_Vacuna = v.id_Vacuna
    JOIN 
        dbo.CentroVacunacion cvc ON c.id_CentroVacunacion = cvc.id_CentroVacunacion
    JOIN 
        dbo.EstadoCita ec ON c.id_EstadoCita = ec.id_Estado
    JOIN
        dbo.Usuario u_registra ON c.id_UsuarioRegistraCita = u_registra.id_Usuario
    LEFT JOIN 
        dbo.Lote l ON c.id_LoteAplicado = l.id_LoteVacuna
    LEFT JOIN
        dbo.Usuario u_personal ON c.id_PersonalSalud = u_personal.id_Usuario
    WHERE 
        c.id_Nino = @id_Nino
    ORDER BY
        c.Fecha DESC, c.Hora DESC;
END;
`;

async function run() {
    try {
        console.log("🔌 Connecting to DB...");
        await sql.connect(config);

        console.log("🛠️ Executing CREATE OR ALTER PROCEDURE...");
        const request = new sql.Request();
        await request.query(SQL_FIX);

        console.log("✅ SP Successfully Updated via Hardcoded Script.");

    } catch (err) {
        console.error("❌ Error updating SP:", err);
    } finally {
        await sql.close();
    }
}
run();
