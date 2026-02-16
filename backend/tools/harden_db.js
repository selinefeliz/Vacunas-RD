require('dotenv').config({ path: './backend/.env' });
const { sql, poolPromise } = require('../config/db');

async function hardenDB() {
    try {
        console.log('--- Database Hardening Script ---');
        const pool = await poolPromise;

        console.log('Checking and disabling xp_cmdshell...');
        await pool.request().query("EXEC sp_configure 'show advanced options', 1; RECONFIGURE;");
        await pool.request().query("EXEC sp_configure 'xp_cmdshell', 0; RECONFIGURE;");

        console.log('Checking and disabling Ad Hoc Distributed Queries...');
        await pool.request().query("EXEC sp_configure 'Ad Hoc Distributed Queries', 0; RECONFIGURE;");

        console.log('Checking and disabling CLR integration...');
        await pool.request().query("EXEC sp_configure 'clr enabled', 0; RECONFIGURE;");

        console.log('✅ Database features hardened successfully (if permissions allowed).');
    } catch (err) {
        console.error('❌ Failed to harden DB features:', err.message);
        console.log('This might be due to insufficient permissions (expected for a limited application user).');
    } finally {
        process.exit(0);
    }
}

hardenDB();
