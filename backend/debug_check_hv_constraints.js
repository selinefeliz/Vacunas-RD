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

async function checkConstraints() {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT 
                tc.CONSTRAINT_NAME, 
                tc.TABLE_NAME, 
                kcu.COLUMN_NAME, 
                tc.CONSTRAINT_TYPE
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
              ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
            WHERE tc.TABLE_NAME = 'HistoricoVacunas'
        `;
        console.table(result.recordset);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

checkConstraints();
