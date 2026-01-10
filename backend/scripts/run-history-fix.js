require('dotenv').config({ path: '../.env' });
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || process.env.DB_AZURE_SERVER_NAME || "micolmado-server.database.windows.net",
    database: process.env.DB_DATABASE || "SistemaVacunacionDB",
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function runMigration() {
    try {
        console.log('Validating environment parameters...');
        if (!config.user || !config.password) {
            throw new Error('Database credentials missing from .env');
        }

        console.log('Connecting to database...');
        const pool = await sql.connect(config);

        const sqlFilePath = path.join(__dirname, '../../database/programmability/usp_GetPatientFullHistory.sql');
        console.log(`Reading SQL file from: ${sqlFilePath}`);

        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing stored procedure update...');
        // Split by GO is often needed for SSMS scripts, but mssql driver might handle simple batches or fail on GO.
        // Usually creating a procedure requires a single batch. 'GO' is not T-SQL, it's a separator.
        // We will strip 'GO' lines if present, assuming the file contains one CREATE/ALTER statement.

        // Remove 'GO' and 'PRINT' statements for cleaner execution
        const batches = sqlContent
            .split(/\nGO\r?\n/i)
            .map(batch => batch.replace(/^PRINT.*$/gm, ''))
            .filter(batch => batch.trim().length > 0);

        for (const batch of batches) {
            console.log('Executing batch...');
            await pool.request().query(batch);
        }

        console.log('Successfully updated usp_GetPatientFullHistory');

        await pool.close();
    } catch (err) {
        console.error('Error executing migration:', err);
        process.exit(1);
    }
}

runMigration();
