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

async function fixSRP() {
    try {
        await sql.connect(config);
        console.log('Connected.');

        // Update SRP Dosis 2 to 180 days instead of 365
        const result = await sql.query`
            UPDATE ev
            SET IntervaloMinimoDias = 180
            FROM dbo.EsquemaVacunacion ev
            JOIN dbo.Vacuna v ON ev.id_Vacuna = v.id_Vacuna
            WHERE v.Nombre = 'SRP' AND ev.NumeroDosis = 2;
        `;

        console.log(`Rows affected: ${result.rowsAffected}`);

        // Verify
        const verify = await sql.query`
            SELECT v.Nombre, ev.NumeroDosis, ev.EdadMinimaMeses, ev.IntervaloMinimoDias
            FROM dbo.EsquemaVacunacion ev
            JOIN dbo.Vacuna v ON ev.id_Vacuna = v.id_Vacuna
            WHERE v.Nombre = 'SRP'
            ORDER BY ev.NumeroDosis
        `;
        console.log('Updated SRP Rules:');
        console.table(verify.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

fixSRP();
