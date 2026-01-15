const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function checkDates() {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT TOP 5 
                VacunaNombre, 
                FechaAplicacion, -- The official "Medical" Date
                FechaCreacion -- The "System" Date (Audit)
            FROM dbo.HistoricoVacunas 
            ORDER BY id_Historico DESC
        `;
        console.table(result.recordset);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

checkDates();
