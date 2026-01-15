const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE, // Fixed from DB_NAME
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function checkSchema() {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT 
                v.Nombre, 
                e.NumeroDosis, 
                e.EdadMinimaMeses, 
                e.EdadMaximaMeses,
                e.IntervaloMinimoDias
            FROM dbo.EsquemaVacunacion e
            JOIN dbo.Vacuna v ON e.id_Vacuna = v.id_Vacuna
            WHERE v.Nombre LIKE '%Neumococo%' OR v.Nombre LIKE '%Rotavirus%'
            ORDER BY v.Nombre, e.NumeroDosis
        `;
        console.table(result.recordset);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

checkSchema();
