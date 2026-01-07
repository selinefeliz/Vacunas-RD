const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sql = require('mssql');
const fs = require('fs');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_AZURE_SERVER_NAME,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_OPTIONS_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_OPTIONS_TRUST_SERVER_CERTIFICATE === 'true'
    },
    port: 1433
};

async function executeSqlFile(pool, filePath) {
    console.log(`Reading script: ${filePath}`);
    const script = fs.readFileSync(filePath, 'utf8');
    const batches = script.split(/^GO\r?\n/im);
    for (const batch of batches) {
        if (batch.trim()) {
            console.log('Executing batch...');
            await pool.request().query(batch);
            console.log('Batch executed successfully.');
        }
    }
}

async function runMigration() {
    let pool;
    try {
        console.log('Connecting to the database...');
        pool = await sql.connect(dbConfig);
        console.log('Connected.');

        // Run function script first due to dependency
        const functionPath = path.resolve(__dirname, '../../database/programmability/fn_CalculateAge.sql');
        await executeSqlFile(pool, functionPath);

        // Run stored procedure script
        const spPath = path.resolve(__dirname, '../../database/programmability/usp_GetNinosByTutor.sql');
        await executeSqlFile(pool, spPath);

        console.log('Migration for tutor children completed successfully!');

    } catch (err) {
        console.error('Error running migration:', err.message);
    } finally {
        if (pool) {
            await pool.close();
            console.log('Connection closed.');
        }
    }
}

runMigration();
