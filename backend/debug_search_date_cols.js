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

async function searchColumns() {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT TABLE_NAME, COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE COLUMN_NAME LIKE '%Creacion%' OR COLUMN_NAME LIKE '%Registro%'
            ORDER BY TABLE_NAME
        `;
        console.table(result.recordset);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

searchColumns();
