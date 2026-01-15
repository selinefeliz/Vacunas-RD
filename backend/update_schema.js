const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function updateSchema() {
    try {
        await sql.connect(config);
        console.log("Connected to database...");

        // 1. Update SRP Dose 2 to 18 months
        // Check if it exists first
        const srpRes = await sql.query(`SELECT id_Esquema FROM EsquemaVacunacion WHERE id_Vacuna = 9 AND NumeroDosis = 2`);
        if (srpRes.recordset.length > 0) {
            await sql.query(`
                UPDATE EsquemaVacunacion 
                SET EdadMinimaMeses = 18, 
                    Descripcion = '18 meses (Refuerzo)'
                WHERE id_Vacuna = 9 AND NumeroDosis = 2
            `);
            console.log("Updated SRP Dose 2 to 18 months.");
        } else {
            // Maybe insert if missing? But inspection showed it exists at 48m.
            console.log("SRP Dose 2 not found (unexpected per inspection). Check manual.");
        }

        // 2. Insert DPT Dose 2 at 48 months (4 years)
        // Check if it exists
        const dptRes = await sql.query(`SELECT id_Esquema FROM EsquemaVacunacion WHERE id_Vacuna = 10 AND NumeroDosis = 2`);
        if (dptRes.recordset.length === 0) {
            // Need to know Interval. DPT Dose 1 is at 18m. Dose 2 at 48m (48-18 = 30m gap). 
            // Let's set IntervalMinimoDias to 365 (1 year) just to be safe it's after Dose 1.
            await sql.query(`
                INSERT INTO EsquemaVacunacion (id_Vacuna, NumeroDosis, EdadMinimaMeses, IntervaloMinimoDias, EsRefuerzo, GeneroObjetivo, Descripcion)
                VALUES (10, 2, 48, 365, 1, 'A', '4 años (Refuerzo)')
            `);
            console.log("Inserted DPT Dose 2 (48 months).");
        } else {
            console.log("DPT Dose 2 already exists.");
        }

    } catch (err) {
        console.error("Error updating schema:", err);
    } finally {
        await sql.close();
    }
}

updateSchema();
