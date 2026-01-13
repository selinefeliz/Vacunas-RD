const { sql, poolPromise } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function deploySp() {
    try {
        const pool = await poolPromise;
        const spPath = path.join(__dirname, '../../database/programmability/usp_GetAllUsers.sql');
        const spContent = fs.readFileSync(spPath, 'utf8');
        const cleanContent = spContent.replace(/\bGO\b/gi, '');

        await pool.query(cleanContent);
        console.log('Successfully deployed usp_GetAllUsers');
        process.exit(0);
    } catch (err) {
        console.error('Failed to deploy SP:', err);
        process.exit(1);
    }
}

deploySp();
