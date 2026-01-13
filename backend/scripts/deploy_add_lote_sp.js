const { sql, poolPromise } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function deploySp() {
    try {
        const pool = await poolPromise;
        const spPath = path.join(__dirname, '../../database/programmability/usp_AddLote.sql');
        const spContent = fs.readFileSync(spPath, 'utf8');
        // Remove 'GO' commands for node-mssql execution (simple split)
        const batches = spContent.split(/\bGO\b/i);

        for (const batch of batches) {
            if (batch.trim()) {
                await pool.query(batch);
            }
        }

        console.log('Successfully deployed usp_AddLote');
        process.exit(0);
    } catch (err) {
        console.error('Failed to deploy SP:', err);
        process.exit(1);
    }
}

deploySp();
