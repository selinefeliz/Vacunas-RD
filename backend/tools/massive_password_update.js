require('dotenv').config({ path: './backend/.env' }); // Load env vars explicitly
const { sql, poolPromise } = require('./config/db');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log('==================================================');
    console.log('   ACTUALIZACIÓN MASIVA DE CONTRASEÑAS (SEGURIDAD)');
    console.log('==================================================');
    console.log('Este script actualizará la contraseña de TODOS los usuarios');
    console.log('en la base de datos a una nueva contraseña segura única.');
    console.log('==================================================\n');

    // Usar la contraseña pasada como argumento O pedirla interactivamente
    const currentPassword = process.argv[2] || '';

    const runUpdate = async (password) => {
        try {
            // 1. Generar Hash
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // 2. Conectar a BD
            const pool = await poolPromise;

            // 3. Ejecutar Update Masivo
            console.log('🔄 Actualizando registros en la tabla Usuario...');
            const result = await pool.request()
                .input('NewPasswordHash', sql.NVarChar(255), hashedPassword)
                .query('UPDATE Usuario SET Clave = @NewPasswordHash');

            console.log('\n✅ ¡ÉXITO! Se han actualizado las contraseñas.');
            console.log(`📊 Total de usuarios afectados: ${result.rowsAffected[0]}`);
            console.log('\nAhora todos los usuarios pueden acceder con la contraseña proporcionada.');

        } catch (err) {
            console.error('\n❌ Ocurrió un error:', err.message);
        } finally {
            if (global.pool) await global.pool.close();
            process.exit(0);
        }
    };

    const validateAndRun = async (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;

        if (!passwordRegex.test(password)) {
            console.error('\n❌ Error: La contraseña debe tener al menos 12 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.');
            if (process.argv[2]) process.exit(1);
            return;
        }

        console.log('\n⏳ Generando hash seguro y conectando a base de datos...');
        await runUpdate(password);
    };

    if (currentPassword) {
        await validateAndRun(currentPassword);
    } else {
        rl.question('Ingrese la nueva contraseña temporal (mínimo 12 caracteres + seguridad): ', async (password) => {
            await validateAndRun(password);
        });
    }
}

main();
