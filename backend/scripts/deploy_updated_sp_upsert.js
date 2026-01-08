const { sql, poolPromise } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function deploySP() {
    try {
        const pool = await poolPromise;
        const spPath = path.join(__dirname, '../database/programmability/usp_AddVaccineLot.sql');

        // Read file - need to go up one level from scripts to root, then to database
        // Actually cwd is backend, so ../database is correctly targeting c:\...\DevOps Vacunacion-1\database
        const filePath = path.join('c:/Users/Cuello/Desktop/programas de funcionalidad/RetoWebDefinitivo-main/DevOps Vacunacion-1/database/programmability/usp_AddVaccineLot.sql');

        console.log(`Reading SP from: ${filePath}`);
        let sqlContent = fs.readFileSync(filePath, 'utf8');

        // Split by GO is often needed for SSMS scripts, but via mssql driver we usually run statements separately.
        // However, standard CREATE/ALTER PROCEDURE must be the first statement in a batch.
        // The script has DROP ... GO ... CREATE.
        // We will split by 'GO' manually and execute chunks.

        const batches = sqlContent.split(/^GO\s*$/m); // Regex for GO on its own line

        for (const batch of batches) {
            const trimmed = batch.trim();
            if (trimmed) {
                console.log('Executing batch...');
                await pool.request().query(trimmed);
                console.log('Batch executed.');
            }
        }

        console.log('Stored Procedure usp_AddVaccineLot updated successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error deploying SP:', err);
        process.exit(1);
    }
}

deploySP();
