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

async function printGroups() {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT DISTINCT EdadMinimaMeses FROM dbo.EsquemaVacunacion ORDER BY EdadMinimaMeses`;
        console.log('Official Age Groups (Months):');
        console.table(result.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

printGroups();
