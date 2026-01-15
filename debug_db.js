const { sql, connectDB } = require('./backend/config/db');

async function debug() {
    try {
        const pool = await connectDB();
        const id_Nino = 14;

        console.log('--- DEBUGGING CHILD 14 ---');

        // 1. Get History
        const r1 = await pool.request().query(`SELECT id_Historico, VacunaNombre, DosisAplicada, FechaAplicacion FROM HistoricoVacunas WHERE id_Nino = ${id_Nino}`);
        console.log('HISTORY Records:', r1.recordset);

        // 2. Get Vaccines match
        const r2 = await pool.request().query(`SELECT id_Vacuna, Nombre FROM Vacuna WHERE Nombre LIKE '%Pentavalente%'`);
        console.log('VACCINE Catalog:', r2.recordset);

        // 3. Test Join
        const r3 = await pool.request().query(`
            SELECT h.VacunaNombre, v.Nombre as CatalogName, v.id_Vacuna 
            FROM HistoricoVacunas h
            LEFT JOIN Vacuna v ON h.VacunaNombre = v.Nombre
            WHERE h.id_Nino = ${id_Nino}
        `);
        console.log('JOIN Result:', r3.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

debug();
