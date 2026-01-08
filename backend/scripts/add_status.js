const { sql, poolPromise } = require('../config/db');

async function addStatus() {
    try {
        const pool = await poolPromise;

        console.log('Checking if "No Suministrada" exists...');

        const checkResult = await pool.request()
            .query("SELECT id_Estado FROM EstadoCita WHERE Estado = 'No Suministrada'");

        if (checkResult.recordset.length > 0) {
            console.log('"No Suministrada" already exists. ID:', checkResult.recordset[0].id_Estado);
        } else {
            console.log('Inserting "No Suministrada"...');
            await pool.request()
                .query("INSERT INTO EstadoCita (Estado) VALUES ('No Suministrada')");
            console.log('Inserted successfully.');
        }

    } catch (err) {
        console.error('Error adding status:', err);
    } finally {
        process.exit();
    }
}

addStatus();
