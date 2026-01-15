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
        trustServerCertificate: true
    }
};

async function analyze() {
    try {
        await sql.connect(config);
        const id_Nino = 15;
        console.log(`--- History for Child ${id_Nino} ---`);
        const history = await sql.query`SELECT * FROM dbo.HistoricoVacunas WHERE id_Nino = ${id_Nino} ORDER BY FechaAplicacion ASC`;
        console.table(history.recordset.map(r => ({
            Vacuna: r.VacunaNombre,
            Dosis: r.DosisAplicada,
            Fecha: r.FechaAplicacion,
            id: r.id_Historico
        })));

        console.log('--- Rules for Pentavalente (id 3?) and Polio (id 2?) and Neumococo (id 8?) ---');
        const rules = await sql.query`
            SELECT v.Nombre, ev.NumeroDosis, ev.IntervaloMinimoDias
            FROM dbo.EsquemaVacunacion ev
            JOIN dbo.Vacuna v ON ev.id_Vacuna = v.id_Vacuna
            WHERE v.id_Vacuna IN (2, 3, 8)
        `;
        console.table(rules.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

analyze();
