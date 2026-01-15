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

async function verify() {
    try {
        await sql.connect(config);

        // 1. Create a clean test child
        const ninoRes = await sql.query`INSERT INTO dbo.Nino (Nombres, Apellidos, FechaNacimiento, Genero, DireccionResidencia, id_Usuario_Tutor, FechaRegistro) 
            OUTPUT INSERTED.id_Nino
            VALUES ('Test', 'Interval', '2025-01-15', 'M', 'Test', 1, GETDATE())`;
        const id_Nino = ninoRes.recordset[0].id_Nino;
        console.log(`Created child ${id_Nino}`);

        // 2. Insert a FUTURE record for Pentavalente (id 3)
        // Dose 1 on March 15, 2026
        // Need a dummy appointment to satisfy UNIQUE(id_Cita) if it's set
        const futureCitaDate = '2026-03-15';
        const futureCitaRes = await sql.query`INSERT INTO dbo.CitaVacunacion (id_Nino, id_Vacuna, Fecha, Hora, id_EstadoCita, id_CentroVacunacion, id_UsuarioRegistraCita)
            OUTPUT INSERTED.id_Cita
            VALUES (${id_Nino}, 3, ${futureCitaDate}, '10:00', 3, 7, 1)`;
        const id_Cita_Future = futureCitaRes.recordset[0].id_Cita;

        const futureDate = '2026-03-15';
        await sql.query`INSERT INTO dbo.HistoricoVacunas (id_Nino, id_Cita, FechaAplicacion, VacunaNombre, DosisAplicada, EdadAlMomento, PersonalSaludNombre)
            VALUES (${id_Nino}, ${id_Cita_Future}, ${futureDate}, 'Pentavalente', 'Dosis 1', '14 meses', 'Tester')`;
        console.log(`Inserted future record for ${futureDate} with id_Cita ${id_Cita_Future}`);

        // 3. Create an appointment for TODAY (Jan 15, 2026)
        // This would have failed before because it would compare with March 15 (-59 days)
        const recordDate = '2026-01-15';
        const citaRes = await sql.query`INSERT INTO dbo.CitaVacunacion (id_Nino, id_Vacuna, Fecha, Hora, id_EstadoCita, id_CentroVacunacion, id_UsuarioRegistraCita)
            OUTPUT INSERTED.id_Cita
            VALUES (${id_Nino}, 3, ${recordDate}, '10:00', 1, 7, 1)`;
        const id_Cita = citaRes.recordset[0].id_Cita;
        console.log(`Created appointment ${id_Cita} for ${recordDate}`);

        // 4. Try to record vaccination via SP
        console.log('Attempting to record vaccination...');
        const request = new sql.Request();
        request.input('id_Cita', sql.Int, id_Cita);
        request.input('id_PersonalSalud_Usuario', sql.Int, 17); // User from error
        request.input('id_LoteAplicado', sql.Int, 1);
        request.input('NombreCompletoPersonalAplicado', sql.NVarChar, 'Tester');
        request.input('DosisAplicada', sql.NVarChar, 'Dosis 1');
        request.input('EdadAlMomento', sql.NVarChar, '12 meses');
        request.output('OutputMessage', sql.NVarChar(255));

        const spRes = await request.execute('dbo.usp_RecordVaccination');
        console.log('Result:', spRes.output.OutputMessage);

        // 5. Cleanup
        console.log('Cleaning up...');
        await sql.query`DELETE FROM dbo.HistoricoCita WHERE id_Cita = ${id_Cita}`;
        await sql.query`DELETE FROM dbo.HistoricoVacunas WHERE id_Nino = ${id_Nino}`;
        await sql.query`DELETE FROM dbo.CitaVacunacion WHERE id_Cita = ${id_Cita}`;
        await sql.query`DELETE FROM dbo.Nino WHERE id_Nino = ${id_Nino}`;
        console.log('Done.');

    } catch (err) {
        console.error('FAILED:', err.message);
        // Attempt cleanup if possible
    } finally {
        await sql.close();
    }
}

verify();
