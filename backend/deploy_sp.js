
const { sql, poolPromise } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function deploySP() {
    try {
        const pool = await poolPromise;
        const spPath = path.join(__dirname, '../database/programmability/usp_GetMedicalAppointments.sql');
        let sqlContent = fs.readFileSync(spPath, 'utf8');

        // Remove 'GO' statements as they are batch separators not supported by single execute
        // Actually tedious/mssql can handle some, but safest to split or remove.
        // Simple regex split on GO on a new line
        const batches = sqlContent.split(/^\s*GO\s*$/m);

        for (const batch of batches) {
            if (batch.trim()) {
                await pool.request().batch(batch);
                console.log('Executed batch.');
            }
        }
        console.log('Stored Procedure updated successfully.');

    } catch (err) {
        console.error('Error updating SP:', err);
    } finally {
        process.exit();
    }
}

deploySP();
