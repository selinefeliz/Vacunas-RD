
const { sql, poolPromise } = require('./config/db');

async function testAppointment() {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        // Mock data similar to what the frontend sends
        // Assuming valid IDs exist. I need to find valid IDs first or just try generic ones and see if it fails on type conversion vs ID not found.
        // If it fails on Date/Time conversion, it will happen before ID checks or at the start of SP execution.

        const id_Nino = null; // Test self appointment or use a valid ID if known
        const id_Vacuna = 1; // Assuming 1 exists
        const id_CentroVacunacion = 1; // Assuming 1 exists
        const Fecha = '2025-12-25';
        const Hora = '14:30';
        const id_Usuario = 1; // Assuming 1 exists

        // Format Hora logic from my fix
        let formattedHora = Hora;
        if (Hora.indexOf(':') === 1) { // h:mm case
            formattedHora = '0' + Hora;
        }
        if (formattedHora.length === 5) { // HH:MM case
            formattedHora = formattedHora + ':00';
        }

        console.log('Testing with formattedHora:', formattedHora);

        request.input('id_Nino', sql.Int, id_Nino);
        request.input('id_Vacuna', sql.Int, id_Vacuna);
        request.input('id_CentroVacunacion', sql.Int, id_CentroVacunacion);
        request.input('Fecha', sql.Date, Fecha);
        request.input('Hora', sql.VarChar(8), formattedHora); // testing my fix
        request.input('id_UsuarioRegistraCita', sql.Int, id_Usuario);
        request.input('RequiereTutor', sql.Bit, id_Nino ? 1 : 0);
        request.output('OutputMessage', sql.NVarChar(255));
        request.output('New_id_Cita', sql.Int);

        const result = await request.execute('usp_ScheduleAppointment');
        console.log('Success:', result.output);

    } catch (err) {
        console.error('Error executing usp_ScheduleAppointment:', err);
        if (err.originalError) {
            console.error('Original Error Info:', err.originalError.info);
        }
    } finally {
        // sql.close(); // poolPromise usually keeps open, but we can close for script
        process.exit();
    }
}

testAppointment();
