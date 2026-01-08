// Script to update usp_GetPatientFullHistory stored procedure
const sql = require('mssql');
require('dotenv').config({ path: '.env' });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
    },
    port: parseInt(process.env.DB_PORT) || 1433,
};

async function updateStoredProcedure() {
    try {
        console.log('Connecting to database...');
        await sql.connect(config);
        console.log('Connected successfully.');

        console.log('Reading stored procedure file...');
        const fs = require('fs');
        const spContent = fs.readFileSync('../database/programmability/usp_GetPatientFullHistory.sql', 'utf8');

        console.log('Updating stored procedure usp_GetPatientFullHistory...');
        await sql.query(spContent);
        console.log('✓ Stored procedure updated successfully!');

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    } finally {
        await sql.close();
    }
}

updateStoredProcedure();
