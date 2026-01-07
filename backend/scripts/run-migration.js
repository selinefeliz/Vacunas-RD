const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sql = require('mssql');
const fs = require('fs');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_AZURE_SERVER_NAME, // Corrected to use the same variable as index.js
    database: process.env.DB_DATABASE, // Corrected to use the same variable as index.js
    options: {
        encrypt: process.env.DB_OPTIONS_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_OPTIONS_TRUST_SERVER_CERTIFICATE === 'true'
    },
    port: 1433
};

async function runMigration() {
    let pool;
    try {
        console.log('Connecting to the database...');
        pool = await sql.connect(dbConfig);
        console.log('Connected.');

        const migrationFilePath = path.resolve(__dirname, 'V5__create_get_vaccines_and_municipios_sp.sql');
        console.log(`Reading migration file: ${migrationFilePath}`);
        const migrationScript = fs.readFileSync(migrationFilePath, 'utf8');

        // Split the script by 'GO' statements to execute batches
        const batches = migrationScript.split(/^GO\r?\n/im);

        for (const batch of batches) {
            if (batch.trim()) {
                console.log('Executing batch...');
                await pool.request().query(batch);
                console.log('Batch executed successfully.');
            }
        }

        console.log('Migration completed successfully!');

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
