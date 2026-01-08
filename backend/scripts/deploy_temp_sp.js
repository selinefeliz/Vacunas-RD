const { sql, poolPromise } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function deploySP() {
    try {
        const pool = await poolPromise;
        const spPath = path.join(__dirname, '../database/programmability/usp_GetMedicosByCentro.sql');
        let sqlContent = fs.readFileSync(spPath, 'utf8');

        // Remove 'GO' statements
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
