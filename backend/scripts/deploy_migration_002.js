const { sql, poolPromise } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function deployMigration() {
    try {
        const pool = await poolPromise;
        const sqlPath = path.join(__dirname, '../../database/migrations/002_AddLoteThresholds.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        const checks = sqlContent.split('GO');

        for (const check of checks) {
            if (check.trim()) {
                await pool.query(check);
            }
        }
        console.log('Successfully deployed 002_AddLoteThresholds.sql');
        process.exit(0);
    } catch (err) {
        console.error('Failed to deploy migration:', err);
        process.exit(1);
    }
}

deployMigration();
