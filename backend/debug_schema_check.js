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
        const res = await sql.query(`
            SELECT v.Nombre, e.NumeroDosis, e.EdadMinimaMeses, e.EdadMaximaMeses 
            FROM EsquemaVacunacion e 
            JOIN Vacuna v ON e.id_Vacuna = v.id_Vacuna 
            WHERE v.Nombre LIKE '%Pentavalente%'
            ORDER BY e.NumeroDosis
        `);
        console.table(res.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}
run();
