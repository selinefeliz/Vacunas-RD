const { sql, poolPromise } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function deploySp() {
    try {
        const pool = await poolPromise;
        const spPath = path.join(__dirname, '../../database/programmability/usp_UpdateAdminUser.sql');
        const spContent = fs.readFileSync(spPath, 'utf8');

        // Split by GO if necessary, but usually simple CREATE OR ALTER works in one go if driver supports it.
        // The mssql driver execute() expects a query or procedure call, but query() allows Create/Alter.
        // We need to remove "GO" batch separators as they are not T-SQL commands.
        const cleanContent = spContent.replace(/\bGO\b/gi, '');

        await pool.query(cleanContent);
        console.log('Successfully deployed usp_UpdateAdminUser');
        process.exit(0);
    } catch (err) {
        console.error('Failed to deploy SP:', err);
        process.exit(1);
    }
}

deploySp();
