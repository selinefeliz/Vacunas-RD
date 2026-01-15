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

async function readSP() {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT definition FROM sys.sql_modules WHERE object_id = OBJECT_ID('dbo.usp_RegisterNino')`;
        console.log(result.recordset[0].definition);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

readSP();
