const { sql, poolPromise } = require('../config/db');

async function diagnose() {
    try {
        const pool = await poolPromise;

        console.log("--- Role 6 Users (Center Staff) ---");
        const users = await pool.request().query("SELECT id_Usuario, Email, id_Rol, id_CentroVacunacion FROM Usuario WHERE id_Rol = 6");
        console.table(users.recordset);

        console.log("\n--- Appointments for Today (2026-01-08) ---");
        const today = '2026-01-08';
        const appointments = await pool.request()
            .input('Fecha', sql.Date, today)
            .query(`
                SELECT id_Cita, Fecha, Hora, id_CentroVacunacion, id_EstadoCita, id_Nino 
                FROM CitaVacunacion 
                WHERE Fecha = @Fecha
            `);
        console.table(appointments.recordset);

        if (appointments.recordset.length > 0 && users.recordset.length > 0) {
            const apptCenter = appointments.recordset[0].id_CentroVacunacion;
            const staffCenter = users.recordset[0].id_CentroVacunacion;

            if (apptCenter !== staffCenter) {
                console.log(`\n[MISMATCH DETECTED]`);
                console.log(`Appointments are in Center ID: ${apptCenter}`);
                console.log(`First Staff User is in Center ID: ${staffCenter}`);
                console.log(`Run 'node scripts/fix_appointments.js ${staffCenter}' to move appointments to this center.`);
            } else {
                console.log(`\n[MATCH] First Staff User and Appointments share Center ID: ${apptCenter}`);
            }
        }

    } catch (err) {
        console.error("Diagnosis Error:", err);
    } finally {
        process.exit();
    }
}

diagnose();
