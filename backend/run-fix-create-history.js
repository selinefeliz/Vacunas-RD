const { sql, connectDB } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const pool = await connectDB();
        const filePath = path.join(__dirname, '../database/programmability/usp_CreatePatientHistory.sql');
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Split by 'GO'
        const batches = sqlContent.split(/\bGO\b/i);

        console.log(`Executing migration: usp_CreatePatientHistory.sql`);

        for (const batch of batches) {
            if (batch.trim().length > 0) {
                console.log('Executing batch...');
                await pool.request().query(batch);
            }
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

runMigration();
