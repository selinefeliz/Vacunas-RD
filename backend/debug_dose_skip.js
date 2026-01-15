const sql = require('mssql');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

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

async function run() {
    try {
        await sql.connect(config);

        // 1. Identify a child who has AT LEAST 1 dose of Polio/Penta
        // Or create a dummy one? Let's try to finding one first.
        const childRes = await sql.query(`
            SELECT TOP 1 h.id_Nino, COUNT(*) as Doses 
            FROM HistoricoVacunas h 
            WHERE h.VacunaNombre LIKE '%Pentavalente%' 
            GROUP BY h.id_Nino 
            HAVING COUNT(*) = 1
        `);

        let childId;
        if (childRes.recordset.length > 0) {
            childId = childRes.recordset[0].id_Nino;
            console.log(`Using Child ID: ${childId} (Has 1 Pentavalente dose)`);
        } else {
            console.log("No child with exactly 1 Pentavalente dose found. Can't reproduce naturally.");
            process.exit();
        }

        console.log("--- Executing SP ---");
        const res = await sql.query(`EXEC usp_CalcularEsquemaVacunacionNino @id_Nino = ${childId}`);

        const schedule = res.recordset.filter(r => r.NombreVacuna.includes('Pentavalente'));
        console.table(schedule.map(r => ({
            Vacuna: r.NombreVacuna,
            Dosis: r.DosisPorAplicar,
            Estado: r.Estado,
            FechaSug: r.FechaSugerida ? new Date(r.FechaSugerida).toISOString().split('T')[0] : 'N/A'
        })));

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}
run();
