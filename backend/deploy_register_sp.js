const sql = require('mssql');
const fs = require('fs');
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

async function deploy() {
    try {
        await sql.connect(config);
        console.log('Connected.');
        let spCode = fs.readFileSync(path.join(__dirname, '..', 'database', 'programmability', 'usp_RegisterNino.sql'), 'utf8');

        // Remove PRINT statements that might cause issues in some environments or just clean up
        // But the main issue is GO which we already removed via PowerShell.

        await sql.query(spCode);
        console.log('SP Deployed.');
    } catch (err) {
        console.error('Deployment failed:', err.message);
    } finally {
        await sql.close();
    }
}

deploy();
