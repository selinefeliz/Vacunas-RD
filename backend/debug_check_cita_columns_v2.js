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

async function checkColumns() {
    try {
        await sql.connect(config);

        // Check if table exists
        const tables = await sql.query`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CitaVacunacion'`;
        console.log("Tables found matching 'CitaVacunacion':", tables.recordset);

        // Select top 1 to see columns
        const result = await sql.query`SELECT TOP 1 * FROM dbo.CitaVacunacion`;
        if (result.recordset.length > 0) {
            console.log("Columns inferred from data:", Object.keys(result.recordset[0]));
        } else {
            // If empty, fallback to schema again but carefully
            console.log("Table empty, trying schema query again...");
            const schema = await sql.query`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CitaVacunacion'`;
            console.log("Schema columns:", schema.recordset);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

checkColumns();
