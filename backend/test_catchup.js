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
        const birthDate = new Date();
        birthDate.setFullYear(birthDate.getFullYear() - 2);
        const birthDateStr = birthDate.toISOString().split('T')[0];

        console.log(`Testing child born on: ${birthDateStr}`);

        // Register child manually to control registration date
        const regResult = await sql.query`
            INSERT INTO dbo.Nino (Nombres, Apellidos, FechaNacimiento, Genero, CodigoIdentificacionPropio, id_Usuario_Tutor, FechaRegistro)
            OUTPUT INSERTED.id_Nino
            VALUES ('Test', 'Catchup', ${birthDateStr}, 'M', 'CATCHUP1', 1, GETDATE());
        `;
        const id_Nino = regResult.recordset[0].id_Nino;
        console.log(`Created test child with ID: ${id_Nino}`);

        // 2. Calculate Schedule
        const result = await sql.query`EXEC dbo.usp_CalcularEsquemaVacunacionNino @id_Nino = ${id_Nino}`;

        console.log('\nCalculated Schedule:');
        const rows = result.recordset.map(r => ({
            Vacuna: r.NombreVacuna,
            Dosis: r.DosisPorAplicar,
            Sugerida: r.FechaSugerida ? r.FechaSugerida.toISOString().split('T')[0] : 'N/A',
            Estado: r.Estado,
            EdadMin: r.EdadMinimaMeses,
            EdadMax: r.EdadMaximaMeses
        }));
        console.table(rows);

        // 3. Cleanup
        await sql.query`DELETE FROM dbo.TutorNino WHERE id_Nino = ${id_Nino}`;
        await sql.query`DELETE FROM dbo.Nino WHERE id_Nino = ${id_Nino}`;
        console.log('\nCleanup done.');

    } catch (err) {
        console.error('Test failed:', err.message);
    } finally {
        await sql.close();
    }
}

test();
