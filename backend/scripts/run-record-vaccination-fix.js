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

async function runExample() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);

        const sqlFilePath = path.join(__dirname, '../../database/programmability/usp_RecordVaccination.sql');
        console.log(`Reading SQL file from: ${sqlFilePath}`);

        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing stored procedure update...');
        // Strip out PRINT and parse batches roughly by GO (though simplified)
        const batches = sqlContent
            .split(/\nGO\r?\n/i)
            .map(b => b.replace(/^PRINT.*$/gm, ''))
            .filter(b => b.trim().length > 0);

        for (const batch of batches) {
            console.log('Executing batch...');
            await pool.request().query(batch);
        }

        console.log('Successfully updated usp_RecordVaccination');
        await pool.close();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

runExample();
