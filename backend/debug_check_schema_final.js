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

async function checkSchema() {
    try {
        await sql.connect(config);

        console.log("Connected. Checking tables...");
        const result = await sql.query`SELECT name FROM sys.tables WHERE name = 'CitaVacunacion'`;
        console.table(result.recordset);

        if (result.recordset.length > 0) {
            console.log("Table exists. Running query...");
            const query = await sql.query`SELECT TOP 1 * FROM dbo.CitaVacunacion`;
            console.log("Query success.");
        } else {
            console.log("Table NOT found.");
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

checkSchema();
