const { sql, connectDB } = require('./config/db');

async function testProcedure() {
    try {
        const pool = await connectDB();

        console.log('--- Testing usp_CalcularEsquemaVacunacionNino for Child 14 ---');
        const result = await pool.request()
            .input('id_Nino', sql.Int, 14)
            .execute('dbo.usp_CalcularEsquemaVacunacionNino');

        console.table(result.recordset);

    } catch (err) {
        console.error('Error executing procedure:', err);
    } finally {
        process.exit();
    }
}

testProcedure();
