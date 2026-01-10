const path = require('path');
require('dotenv').config(); // Assumes .env is in current directory (backend/)
const sql = require('mssql');
const fs = require('fs');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || process.env.DB_AZURE_SERVER_NAME || "micolmado-server.database.windows.net",
    database: process.env.DB_DATABASE || "SistemaVacunacionDB",
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    },
    port: parseInt(process.env.DB_PORT) || 1433
};

// Check for Integrated Security (matching db.js)
if (process.env.DB_OPTIONS_INTEGRATED_SECURITY === "true") {
    config.authentication = {
        type: "ntlm",
        options: {
            domain: "",
            userName: "",
            password: ""
        }
    };
} else if (process.env.DB_USER && process.env.DB_PASSWORD) {
    config.authentication = { type: "default" };
} else {
    // Fallback default
    config.authentication = { type: "ntlm", options: { domain: "", userName: "", password: "" } };
}

async function runMigration() {
    let pool;
    try {
        console.log('Connecting to the database...');
        pool = await sql.connect(config);
        console.log('Connected.');

        // Update path to the new migration file
        const migrationFilePath = path.resolve(__dirname, '../../database/migrations/012_add_fecha_nacimiento.sql');
        console.log(`Reading migration file: ${migrationFilePath}`);
        const migrationScript = fs.readFileSync(migrationFilePath, 'utf8');

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
