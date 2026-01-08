const { sql, poolPromise } = require('../config/db');

async function seed() {
    try {
        const pool = await poolPromise;

        // Get necessary IDs (First available)
        const center = await pool.request().query("SELECT TOP 1 id_CentroVacunacion FROM CentroVacunacion");
        const vaccine = await pool.request().query("SELECT TOP 1 id_Vacuna FROM Vacuna");
        const child = await pool.request().query("SELECT TOP 1 id_Nino FROM Nino");
        const user = await pool.request().query("SELECT TOP 1 id_Usuario FROM Usuario");

        if (!center.recordset[0] || !vaccine.recordset[0] || !child.recordset[0] || !user.recordset[0]) {
            console.error("Error: Missing base data (Center, Vaccine, Child, or User) to seed appointments.");
            console.log("Center:", center.recordset[0]);
            console.log("Vaccine:", vaccine.recordset[0]);
            console.log("Child:", child.recordset[0]);
            console.log("User:", user.recordset[0]);
            process.exit(1);
            return;
        }

        const id_Centro = center.recordset[0].id_CentroVacunacion;
        const id_Vacuna = vaccine.recordset[0].id_Vacuna;
        const id_Nino = child.recordset[0].id_Nino;
        const id_Usuario = user.recordset[0].id_Usuario;

        console.log(`Seeding data for Center ID: ${id_Centro}`);

        const today = new Date().toISOString().split('T')[0];
        // Appointment times
        const times = ['09:00:00', '10:30:00', '14:00:00'];

        for (const time of times) {
            await pool.request()
                .input('id_Nino', sql.Int, id_Nino)
                .input('id_Vacuna', sql.Int, id_Vacuna)
                .input('id_CentroVacunacion', sql.Int, id_Centro)
                .input('Fecha', sql.Date, today)
                .input('Hora', sql.VarChar(8), time)
                .input('id_UsuarioRegistraCita', sql.Int, id_Usuario)
                .input('id_EstadoCita', sql.Int, 2) // 2 = Confirmada
                .query(`
                    INSERT INTO CitaVacunacion 
                    (id_Nino, id_Vacuna, id_CentroVacunacion, Fecha, Hora, id_UsuarioRegistraCita, id_EstadoCita, RequiereTutor, FechaCreacion)
                    VALUES 
                    (@id_Nino, @id_Vacuna, @id_CentroVacunacion, @Fecha, @Hora, @id_UsuarioRegistraCita, @id_EstadoCita, 1, GETDATE())
                `);
            console.log(`Inserted appointment at ${time}`);
        }

        console.log("Successfully inserted 3 confirmed appointments for TODAY.");

    } catch (err) {
        console.error("Error seeding appointments:", err);
    } finally {
        process.exit();
    }
}

seed();
