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

async function findMostRecent() {
    try {
        await sql.connect(config);
        console.log('--- Top 10 Most Recent Records (id_Historico) ---');
        const result = await sql.query`
            SELECT TOP 10 hv.*, n.Nombres 
            FROM dbo.HistoricoVacunas hv
            JOIN dbo.Nino n ON hv.id_Nino = n.id_Nino
            ORDER BY hv.id_Historico DESC
        `;
        result.recordset.forEach(r => {
            console.log(`ID: ${r.id_Historico} | Child: ${r.Nombres} (${r.id_Nino}) | Vaccine: ${r.VacunaNombre} | Dose: ${r.DosisAplicada} | Date: ${r.FechaAplicacion.toISOString().split('T')[0]}`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

findMostRecent();
