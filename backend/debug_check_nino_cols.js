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

async function checkNinoColumns() {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Nino'
        `;
        console.table(result.recordset);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

checkNinoColumns();
