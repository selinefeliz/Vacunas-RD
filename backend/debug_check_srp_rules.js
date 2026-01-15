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

async function checkSRP() {
    try {
        await sql.connect(config);
        console.log('Connected.');

        const result = await sql.query`
            SELECT v.Nombre, ev.NumeroDosis, ev.EdadMinimaMeses, ev.IntervaloMinimoDias
            FROM dbo.EsquemaVacunacion ev
            JOIN dbo.Vacuna v ON ev.id_Vacuna = v.id_Vacuna
            WHERE v.Nombre LIKE '%SRP%'
            ORDER BY ev.NumeroDosis
        `;
        console.log('SRP Rules in Schema:');
        console.table(result.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

checkSRP();
