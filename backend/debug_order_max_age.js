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

        // Find a child > 8 months. Or mocking it might be hard without inserting.
        // Let's create a temporary child strictly for this test if possible, or pick one.
        // Searching for a child born > 8 months ago (Feb 2025 or earlier).
        const childRes = await sql.query(`SELECT TOP 1 id_Nino, FechaNacimiento, DATEDIFF(MONTH, FechaNacimiento, GETDATE()) as Meses FROM Nino WHERE DATEDIFF(MONTH, FechaNacimiento, GETDATE()) > 9`);

        let childId;
        if (childRes.recordset.length > 0) {
            childId = childRes.recordset[0].id_Nino;
            console.log(`Using existing child ID: ${childId} (Age: ${childRes.recordset[0].Meses} months)`);
        } else {
            console.log("No suitable child found. Aborting (or insert one).");
            return;
        }

        const res = await sql.query(`EXEC usp_CalcularEsquemaVacunacionNino @id_Nino = ${childId}`);
        console.table(res.recordset.map(r => ({
            Vacuna: r.NombreVacuna,
            Dosis: r.DosisPorAplicar,
            EdadMin: r.EdadMinimaMeses,
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
