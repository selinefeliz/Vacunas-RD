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

async function checkVacunas() {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT id_Vacuna, Nombre FROM dbo.Vacuna ORDER BY Nombre`;
        console.table(result.recordset);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

checkVacunas();
