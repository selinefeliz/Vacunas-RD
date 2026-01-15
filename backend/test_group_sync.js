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

async function test() {
    try {
        await sql.connect(config);
        console.log('Connected.');

        // 1. Create a dummy child born 2 years ago today
        const birthDate = '2024-01-15';
        const regDate = '2026-01-15';

        console.log(`Testing child born on: ${birthDate}, Registered on: ${regDate}`);

        // Register child manually to control registration date
        const regResult = await sql.query`
            INSERT INTO dbo.Nino (Nombres, Apellidos, FechaNacimiento, Genero, CodigoIdentificacionPropio, id_Usuario_Tutor, FechaRegistro, DireccionResidencia)
            OUTPUT INSERTED.id_Nino
            VALUES ('Test', 'GroupSync', ${birthDate}, 'M', 'GROUPSYNC1', 1, ${regDate}, 'Test');
        `;
        const id_Nino = regResult.recordset[0].id_Nino;
        console.log(`Created test child with ID: ${id_Nino}`);

        // 2. Add some Group 0 history (Born)
        // Need dummy appointments for each to satisfy UNIQUE(id_Cita)
        async function insertHistory(vacName, dose, date) {
            const cita = await sql.query`INSERT INTO dbo.CitaVacunacion (id_Nino, id_Vacuna, Fecha, Hora, id_EstadoCita, id_CentroVacunacion, id_UsuarioRegistraCita)
                OUTPUT INSERTED.id_Cita
                VALUES (${id_Nino}, (SELECT id_Vacuna FROM dbo.Vacuna WHERE Nombre = ${vacName}), ${date}, '08:00', 3, 7, 1)`;
            const cid = cita.recordset[0].id_Cita;
            await sql.query`INSERT INTO dbo.HistoricoVacunas (id_Nino, id_Cita, VacunaNombre, DosisAplicada, FechaAplicacion, PersonalSaludNombre)
                VALUES (${id_Nino}, ${cid}, ${vacName}, ${dose}, ${date}, 'Tester')`;
            return cid;
        }

        await insertHistory('BCG', 'Dosis 1', birthDate);
        await insertHistory('Hepatitis B', 'Dosis 1', birthDate);

        // 3. Calculate INITIAL Schedule (Catch-up start)
        console.log('\n--- Initial Catch-up Schedule (Everything missing) ---');
        let result = await sql.query`EXEC dbo.usp_CalcularEsquemaVacunacionNino @id_Nino = ${id_Nino}`;
        display(result.recordset);

        // 4. Simulate applying ONE vaccine from Group 2 (2 months) TODAY
        console.log('\n--- Status AFTER applying ONE Group 2 vaccine (Polio Oral) Today ---');
        await insertHistory('Polio Oral', 'Dosis 1', regDate);

        result = await sql.query`EXEC dbo.usp_CalcularEsquemaVacunacionNino @id_Nino = ${id_Nino}`;
        display(result.recordset);

        // 5. Simulate COMPLETING the 2-month group TOMORROW
        const tomorrow = '2026-01-16';
        console.log(`\n--- Status AFTER COMPLETING 2-month group on ${tomorrow} ---`);
        await insertHistory('Pentavalente', 'Dosis 1', tomorrow);
        await insertHistory('Rotavirus', 'Dosis 1', tomorrow);
        await insertHistory('Neumococo', 'Dosis 1', tomorrow);

        result = await sql.query`EXEC dbo.usp_CalcularEsquemaVacunacionNino @id_Nino = ${id_Nino}`;
        display(result.recordset);

        // 6. Cleanup
        await sql.query`DELETE FROM dbo.TutorNino WHERE id_Nino = ${id_Nino}`;
        await sql.query`DELETE FROM dbo.HistoricoVacunas WHERE id_Nino = ${id_Nino}`;
        await sql.query`DELETE FROM dbo.Nino WHERE id_Nino = ${id_Nino}`;
        console.log('\nCleanup done.');

    } catch (err) {
        console.error('Test failed:', err.message);
    } finally {
        await sql.close();
    }
}

function display(recordset) {
    const rows = recordset.map(r => ({
        Vacuna: r.NombreVacuna,
        Age: r.EdadMinimaMeses,
        Dosis: r.DosisPorAplicar,
        Sugerida: r.FechaSugerida ? r.FechaSugerida.toISOString().split('T')[0] : 'N/A',
        Estado: r.Estado
    }));
    // Filter to show a few groups to see the sync
    console.table(rows.filter(r => r.Age <= 12));
}

test();
