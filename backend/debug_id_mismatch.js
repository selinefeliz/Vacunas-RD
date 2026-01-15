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

        // 1. Find Giselle
        const childRes = await sql.query(`
            SELECT id_Nino, Nombres, Apellidos 
            FROM Nino 
            WHERE Nombres LIKE '%Giselle%' AND Apellidos LIKE '%Feliz%'
        `);

        if (childRes.recordset.length === 0) {
            console.log("❌ Giselle not found");
            return;
        }

        const id_Nino = childRes.recordset[0].id_Nino;
        console.log(`✅ Found Giselle, ID: ${id_Nino}`);

        // 2. Get Appointments
        console.log("\n--- APPOINTMENTS (usp_GetAppointmentsByNino) ---");
        const apptReq = new sql.Request();
        apptReq.input('id_Nino', sql.Int, id_Nino);
        const apptRes = await apptReq.execute('dbo.usp_GetAppointmentsByNino');

        const appointments = apptRes.recordset;
        console.table(appointments.map(a => ({
            id_Cita: a.id_Cita,
            id_Vacuna: a.id_Vacuna, // This is what we need to match
            Nombre: a.NombreVacuna,
            Fecha: a.Fecha,
            Estado: a.EstadoCita
        })));

        // 3. Get Schedule
        console.log("\n--- SCHEDULE (usp_CalcularEsquemaVacunacionNino) ---");
        const schReq = new sql.Request();
        schReq.input('id_Nino', sql.Int, id_Nino);
        const schRes = await schReq.execute('dbo.usp_CalcularEsquemaVacunacionNino');

        const schedule = schRes.recordset.filter(s => s.NombreVacuna.includes('Neumococo'));
        console.table(schedule.map(s => ({
            id_Vacuna: s.id_Vacuna, // This is what UI uses to match
            Nombre: s.NombreVacuna,
            Dosis: s.DosisPorAplicar,
            Estado: s.Estado
        })));

        // 4. Comparison
        const neumococoAppt = appointments.find(a => a.NombreVacuna.includes('Neumococo') && a.EstadoCita === 'Agendada');
        const neumococoSch = schedule.find(s => s.Estado !== 'Edad Excedida' && s.NombreVacuna.includes('Neumococo'));

        if (neumococoAppt && neumococoSch) {
            console.log(`\n🔎 Matching Check:`);
            console.log(`Appointment ID_Vacuna: ${neumococoAppt.id_Vacuna}`);
            console.log(`Schedule ID_Vacuna:    ${neumococoSch.id_Vacuna}`);

            if (neumococoAppt.id_Vacuna === neumococoSch.id_Vacuna) {
                console.log("✅ IDs MATCH. Problem is likely in Frontend Logic.");
            } else {
                console.log("❌ IDs DO NOT MATCH. This is the bug.");
            }
        } else {
            console.log("\n⚠️ Could not find both Appointment and Schedule item for comparison.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}
run();
