const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function findRecentChild() {
    try {
        await sql.connect(config);

        // Find most recent appointment attended or being attended
        // Or check most recent HistoricoVacunas
        console.log('--- Recent HistoricoVacunas ---');
        const hist = await sql.query`SELECT TOP 5 * FROM dbo.HistoricoVacunas ORDER BY id_Historico DESC`;
        console.table(hist.recordset.map(r => ({
            id: r.id_Historico,
            id_Nino: r.id_Nino,
            Vacuna: r.VacunaNombre,
            Fecha: r.FechaAplicacion,
            Dosis: r.DosisAplicada
        })));

        console.log('--- Recent Citas ---');
        const cites = await sql.query`SELECT TOP 5 * FROM dbo.CitaVacunacion WHERE id_EstadoCita = 3 ORDER BY Fecha DESC`;
        console.table(cites.recordset.map(r => ({
            id: r.id_Cita,
            id_Nino: r.id_Nino,
            Date: r.Fecha,
            Vaccine: r.id_Vacuna
        })));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

findRecentChild();
