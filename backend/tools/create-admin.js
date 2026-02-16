const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sql = require('mssql');
const bcrypt = require('bcrypt');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        encrypt: true, // For Azure SQL
        trustServerCertificate: false
    }
};

async function createAdmin() {
    const adminEmail = 'admin@vaccinationsystem.com';
    const adminPassword = 'password123';

    let pool;
    try {
        console.log('Connecting to the database...');
        pool = await sql.connect(dbConfig);
        console.log('Connected.');

        const userExistsResult = await pool.request()
            .input('Email', sql.NVarChar, adminEmail)
            .query('SELECT id_Usuario FROM Usuario WHERE Email = @Email');

        if (userExistsResult.recordset.length > 0) {
            console.log(`Admin user ${adminEmail} already exists. Aborting.`);
            return;
        }

        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const roleResult = await pool.request().query("SELECT id_Rol FROM Rol WHERE Rol = 'Administrador'");
        const adminRoleId = roleResult.recordset[0].id_Rol;

        const statusResult = await pool.request().query("SELECT id_Estado FROM EstadoUsuario WHERE Estado = 'Activo'");
        const activeStatusId = statusResult.recordset[0].id_Estado;

        await pool.request()
            .input('id_Rol', sql.Int, adminRoleId)
            .input('id_Estado', sql.Int, activeStatusId)
            .input('Email', sql.NVarChar, adminEmail)
            .input('Clave', sql.NVarChar, hashedPassword)
            .query('INSERT INTO Usuario (id_Rol, id_Estado, Email, Clave) VALUES (@id_Rol, @id_Estado, @Email, @Clave)');

        console.log('Admin user created successfully!');
        console.log(`  Email: ${adminEmail}`);
        console.log(`  Password: ${adminPassword}`);

    } catch (err) {
        console.error('Error creating admin user:', err.message);
    } finally {
        if (pool) {
            await pool.close();
            console.log('Connection closed.');
        }
    }
}

createAdmin();
