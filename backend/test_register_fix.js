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
        console.log('Connected.');

        console.log('Attempting to register child via usp_RegisterNino...');
        const request = new sql.Request();

        // Match parameters of usp_RegisterNino
        request.input('Nombres_Nino', sql.NVarChar, 'Test');
        request.input('Apellidos_Nino', sql.NVarChar, 'Registration');
        request.input('FechaNacimiento_Nino', sql.Date, '2025-01-15');
        request.input('Genero_Nino', sql.Char, 'M');
        request.input('id_Tutor', sql.Int, 1);

        request.output('OutputMessage', sql.NVarChar(255));
        request.output('New_id_Nino', sql.Int);
        request.output('New_id_Usuario_Nino', sql.Int);

        const result = await request.execute('dbo.usp_RegisterNino');

        console.log('SP executed successfully.');
        console.log('OutputMessage:', result.output.OutputMessage);
        console.log('New_id_Nino:', result.output.New_id_Nino);

        if (result.output.New_id_Nino) {
            console.log('Cleanup...');
            const id = result.output.New_id_Nino;
            await sql.query`DELETE FROM dbo.TutorNino WHERE id_Nino = ${id}`;
            await sql.query`DELETE FROM dbo.Nino WHERE id_Nino = ${id}`;
            console.log('Done.');
        }

    } catch (err) {
        console.error('FAILED:', err.message);
    } finally {
        await sql.close();
    }
}

verify();
