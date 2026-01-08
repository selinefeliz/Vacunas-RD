const { sql, poolPromise } = require('../config/db');

async function cleanExpiredLots() {
    try {
        const pool = await poolPromise;
        const lotNumber = 'NATASHACACONA';

        console.log(`Searching for lots with number: ${lotNumber}...`);

        // Check first
        const checkResult = await pool.request()
            .input('NumeroLote', sql.NVarChar, lotNumber)
            .query('SELECT * FROM Lote WHERE NumeroLote = @NumeroLote');

        console.log(`Found ${checkResult.recordset.length} lots to delete.`);
        checkResult.recordset.forEach(lot => {
            console.log(`- ID: ${lot.id_Lote}, Exp: ${lot.FechaCaducidad}, Center: ${lot.id_CentroVacunacion}`);
        });

        if (checkResult.recordset.length > 0) {
            // Delete
            const deleteResult = await pool.request()
                .input('NumeroLote', sql.NVarChar, lotNumber)
                .query('DELETE FROM Lote WHERE NumeroLote = @NumeroLote');

            console.log(`Deleted ${deleteResult.rowsAffected[0]} rows.`);
        } else {
            console.log("No lots found to delete.");
        }

        process.exit(0);
    } catch (err) {
        console.error('Error cleaning lots:', err);
        process.exit(1);
    }
}

cleanExpiredLots();
