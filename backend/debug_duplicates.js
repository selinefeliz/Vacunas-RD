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
        const childId = 7; // The failing child

        console.log("--- Checking CitaVacunacion (Appts) ---");
        const citas = await sql.query(`SELECT id_Vacuna, Fecha, id_EstadoCita FROM CitaVacunacion WHERE id_Nino = ${childId}`);
        console.table(citas.recordset);

        console.log("--- Checking HistoricoVacunas (History) ---");
        const historico = await sql.query(`SELECT VacunaNombre, FechaAplicacion FROM HistoricoVacunas WHERE id_Nino = ${childId}`);
        console.table(historico.recordset);

        console.log("--- Checking Duplication Logic ---");
        // Simulate the UNION from the SP
        const duplicates = await sql.query(`
            SELECT c.id_Vacuna, c.Fecha 
            FROM CitaVacunacion c 
            WHERE c.id_Nino = ${childId} AND c.id_EstadoCita IN (1, 2, 3)
            UNION ALL
            SELECT v.id_Vacuna, h.FechaAplicacion
            FROM HistoricoVacunas h
            JOIN Vacuna v ON LTRIM(RTRIM(h.VacunaNombre)) = LTRIM(RTRIM(v.Nombre))
            WHERE h.id_Nino = ${childId}
        `);
        console.log("Total Doses Counted by SP:", duplicates.recordset.length);
        console.table(duplicates.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}
run();
