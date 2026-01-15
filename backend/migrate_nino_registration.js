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

async function migrate() {
    try {
        await sql.connect(config);
        console.log('Connected to database.');

        // 1. Add Column
        console.log('Adding FechaRegistro column...');
        await sql.query`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Nino') AND name = 'FechaRegistro')
            BEGIN
                ALTER TABLE dbo.Nino ADD FechaRegistro DATETIME NULL;
            END
        `;

        // 2. Populate existing records with their birthday (as a safe default for registration)
        console.log('Populating existing FechaRegistro values...');
        await sql.query`
            UPDATE dbo.Nino 
            SET FechaRegistro = FechaNacimiento 
            WHERE FechaRegistro IS NULL;
        `;

        // 3. Make it NOT NULL for future records
        console.log('Setting FechaRegistro to NOT NULL...');
        await sql.query`
            ALTER TABLE dbo.Nino ALTER COLUMN FechaRegistro DATETIME NOT NULL;
        `;

        console.log('Migration successful.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await sql.close();
    }
}

migrate();
