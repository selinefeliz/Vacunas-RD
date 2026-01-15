require('dotenv').config({ path: './backend/.env' });
const { sql, connectDB } = require('./backend/config/db');

async function inspect() {
    try {
        const pool = await connectDB();

        console.log('--- Inspecting EsquemaVacunacion ---');
        const r1 = await pool.request().query(`
            SELECT 
                ev.id_Vacuna, 
                v.Nombre, 
                ev.EdadMinimaMeses, 
                ev.EdadRecomendadaMeses, 
                ev.IntervaloMinimoDias,
                ev.NumeroDosis
            FROM EsquemaVacunacion ev
            JOIN Vacuna v ON ev.id_Vacuna = v.id_Vacuna
            ORDER BY ev.EdadMinimaMeses, ev.id_Vacuna
        `);
        console.table(r1.recordset);

        console.log('--- Inspecting Child 14 Data ---');
        const r2 = await pool.request().query(`
            SELECT * FROM HistoricoVacunas WHERE id_Nino = 14
        `);
        console.table(r2.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

inspect();
