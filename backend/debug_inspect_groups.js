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

async function inspect() {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT DISTINCT EdadMinimaMeses 
            FROM dbo.EsquemaVacunacion 
            ORDER BY EdadMinimaMeses ASC
        `;
        console.log('Age Groups (Months):');
        console.table(result.recordset);

        const samples = await sql.query`
            SELECT TOP 10 v.Nombre, ev.NumeroDosis, ev.EdadMinimaMeses
            FROM dbo.EsquemaVacunacion ev
            JOIN dbo.Vacuna v ON ev.id_Vacuna = v.id_Vacuna
            ORDER BY ev.EdadMinimaMeses ASC
        `;
        console.log('Sample Distributions:');
        console.table(samples.recordset.map(r => ({
            Vaccine: r.Nombre,
            Dose: r.NumeroDosis,
            Age: r.EdadMinimaMeses
        })));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

inspect();
