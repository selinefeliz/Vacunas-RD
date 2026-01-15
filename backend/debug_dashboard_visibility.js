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

        // 1. Find Tutor for Child 15
        const tutorRes = await sql.query(`
            SELECT TOP 1 t.id_Usuario, t.Nombres, t.Apellidos 
            FROM TutorNino tn
            JOIN Tutor t ON tn.id_Tutor = t.id_Tutor
            WHERE tn.id_Nino = 15
        `);

        if (tutorRes.recordset.length === 0) {
            console.log("No Tutor found for Child 15!");
            return;
        }

        const tutorUserId = tutorRes.recordset[0].id_Usuario;
        console.log(`Checking Dashboard for Tutor User ID: ${tutorUserId} (${tutorRes.recordset[0].Nombres})`);

        // 2. Execute SP
        const request = new sql.Request();
        request.input('id_Usuario', sql.Int, tutorUserId);
        const res = await request.execute('dbo.usp_GetAppointmentsByUser');

        const appts = res.recordset.map(r => ({
            id: r.id_Cita,
            Fecha: r.Fecha.toISOString(),
            Vacuna: r.NombreVacuna,
            Paciente: r.NombrePaciente,
            Estado: r.EstadoCita,
            RequiereTutor: r.RequiereTutor // CHECK THIS VALUE
        }));

        console.table(appts);

        const found = appts.find(a => a.id === 51); // Appointment 51 from previous debug
        if (found) {
            console.log("✅ Appointment 51 IS visible to Tutor.");
        } else {
            console.log("❌ Appointment 51 is NOT visible.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}
run();
