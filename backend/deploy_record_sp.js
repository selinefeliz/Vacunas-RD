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
        const spCode = fs.readFileSync(path.join(__dirname, '..', 'database', 'programmability', 'usp_RecordVaccination.sql'), 'utf8');
        await sql.query(spCode);
        console.log('SP Deployed.');
    } catch (err) {
        console.error('Deployment failed:', err.message);
    } finally {
        await sql.close();
    }
}

deploy();
