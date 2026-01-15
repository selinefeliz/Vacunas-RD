const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function checkNeumo() {
    try {
        await sql.connect(config);

        // Find most recent child with Neumococo appointments
        const childQuery = await sql.query`
            SELECT TOP 1 id_Nino FROM dbo.CitaVacunacion 
            WHERE id_Vacuna IN (SELECT id_Vacuna FROM dbo.Vacuna WHERE Nombre LIKE '%Neumococo%')
            ORDER BY id_Cita DESC
        `;

        if (childQuery.recordset.length === 0) {
            console.log("No child found with Neumococo appointments.");
            return;
        }

        const id_Nino = childQuery.recordset[0].id_Nino;
        console.log(`Checking Neumo status for Child ID: ${id_Nino}`);

        // Get History/Applied for Neumococo
        const applied = await sql.query`
             SELECT 
                v.Nombre as Vacuna,
                da.FechaAplicacion
            FROM (
                SELECT id_Vacuna, Fecha as FechaAplicacion FROM dbo.CitaVacunacion WHERE id_Nino = ${id_Nino} AND id_EstadoCita = 3 -- Asistida
                UNION
                SELECT v.id_Vacuna, h.FechaAplicacion 
                FROM dbo.HistoricoVacunas h 
                JOIN dbo.Vacuna v ON h.VacunaNombre = v.Nombre 
                WHERE h.id_Nino = ${id_Nino}
            ) da
            JOIN dbo.Vacuna v ON da.id_Vacuna = v.id_Vacuna
            WHERE v.Nombre LIKE '%Neumococo%'
        `;
        console.log("Applied Doses:");
        console.table(applied.recordset);

        // Get Appointments
        const appointments = await sql.query`
            SELECT 
                v.Nombre, 
                c.Fecha, 
                ec.Estado 
            FROM dbo.CitaVacunacion c
            JOIN dbo.Vacuna v ON c.id_Vacuna = v.id_Vacuna
            JOIN dbo.EstadoCita ec ON c.id_EstadoCita = ec.id_Estado
            WHERE c.id_Nino = ${id_Nino} AND v.Nombre LIKE '%Neumococo%'
        `;
        console.log("All Appointments:");
        console.table(appointments.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

checkNeumo();
