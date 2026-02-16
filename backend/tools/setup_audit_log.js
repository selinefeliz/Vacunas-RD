const { sql, poolPromise } = require('../config/db');

async function setupAuditLog() {
    try {
        const pool = await poolPromise;

        console.log('Creating Auditoria table...');
        await pool.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Auditoria')
            BEGIN
                CREATE TABLE Auditoria (
                    id_Auditoria INT IDENTITY(1,1) PRIMARY KEY,
                    Fecha DATETIME DEFAULT GETDATE(),
                    id_Usuario INT NULL,
                    Usuario NVARCHAR(100),
                    Accion NVARCHAR(50),
                    Recurso NVARCHAR(50),
                    id_Recurso NVARCHAR(50),
                    Detalles NVARCHAR(MAX),
                    DireccionIP NVARCHAR(50)
                );
            END
        `);
        console.log('Auditoria table created or already exists.');

        console.log('Creating usp_CreateAuditLog...');
        await pool.query(`
            CREATE OR ALTER PROCEDURE usp_CreateAuditLog
                @id_Usuario INT,
                @Usuario NVARCHAR(100),
                @Accion NVARCHAR(50),
                @Recurso NVARCHAR(50),
                @id_Recurso NVARCHAR(50),
                @Detalles NVARCHAR(MAX),
                @DireccionIP NVARCHAR(50)
            AS
            BEGIN
                INSERT INTO Auditoria (id_Usuario, Usuario, Accion, Recurso, id_Recurso, Detalles, DireccionIP, Fecha)
                VALUES (@id_Usuario, @Usuario, @Accion, @Recurso, @id_Recurso, @Detalles, @DireccionIP, GETDATE());
            END
        `);
        console.log('usp_CreateAuditLog created.');

        console.log('Creating usp_GetAuditLogs...');
        await pool.query(`
            CREATE OR ALTER PROCEDURE usp_GetAuditLogs
            AS
            BEGIN
                SELECT * FROM Auditoria ORDER BY Fecha DESC;
            END
        `);
        console.log('usp_GetAuditLogs created.');

        console.log('Audit Log setup completed successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error setting up Audit Log:', err);
        process.exit(1);
    }
}

setupAuditLog();
