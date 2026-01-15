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

async function checkAppointments() {
    try {
        await sql.connect(config);
        // We'll target the child ID from the context if possible, or just look for the most recent appts
        // From previous context, child might be ID 16 or similar. Let's look for Pentavalente appointments.
        const result = await sql.query`
            SELECT 
                c.id_Cita,
                c.id_Nino,
                c.id_Vacuna,
                v.Nombre as NombreVacuna,
                c.Fecha,
                c.Hora,
                ec.Estado as EstadoCita
            FROM dbo.CitaVacunacion c
            JOIN dbo.Vacuna v ON c.id_Vacuna = v.id_Vacuna
            JOIN dbo.EstadoCita ec ON c.id_EstadoCita = ec.id_Estado
            WHERE v.Nombre = 'Pentavalente' 
              AND ec.Estado IN ('Agendada', 'Confirmada')
            ORDER BY c.id_Nino, c.Fecha
        `;

        console.table(result.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

checkAppointments();
