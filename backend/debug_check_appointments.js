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

        console.log("--- Latest 5 Created Appointments ---");
        const res = await sql.query(`
            SELECT TOP 5 c.id_Cita, c.id_Nino, c.id_Vacuna, c.Fecha, e.Estado as EstadoCita
            FROM CitaVacunacion c
            JOIN EstadoCita e ON c.id_EstadoCita = e.id_Estado
            ORDER BY c.id_Cita DESC
        `);

        console.table(res.recordset.map(r => ({
            id: r.id_Cita,
            Nino: r.id_Nino,
            Vacuna: r.id_Vacuna,
            Fecha: r.Fecha.toISOString(),
            Estado: r.EstadoCita
        })));


    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}
run();
