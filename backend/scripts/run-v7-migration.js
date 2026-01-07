require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const dbConfig = {
    server: process.env.DB_AZURE_SERVER_NAME,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
        encrypt: process.env.DB_OPTIONS_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_OPTIONS_TRUST_SERVER_CERTIFICATE === 'true'
    }
};

async function executeMigration() {
    const filePath = path.join(__dirname, 'V7__fix_sp_table_name.sql');
    console.log('Connecting to the database...');
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        console.log('Connected.');

        console.log(`Reading migration file: ${filePath}`);
        const script = fs.readFileSync(filePath, 'utf8');
        
        const batches = script.split(/^\s*GO\s*$/im);

        for (const batch of batches) {
            if (batch.trim()) {
                console.log('Executing batch...');
                await pool.request().batch(batch);
                console.log('Batch executed successfully.');
            }
        }

        console.log('Migration V7 completed successfully!');
    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        if (pool) {
            await pool.close();
            console.log('Connection closed.');
        }
    }
}

executeMigration();
