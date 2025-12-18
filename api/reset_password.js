const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('='.repeat(60));
console.log('  GENERADOR DE HASH DE CONTRASEÑA - Sistema de Vacunación');
console.log('='.repeat(60));
console.log('');

rl.question('Ingresa la nueva contraseña: ', (password) => {
    if (!password || password.length < 6) {
        console.log('\n❌ Error: La contraseña debe tener al menos 6 caracteres.');
        rl.close();
        return;
    }

    console.log('\n⏳ Generando hash...\n');

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('❌ Error al generar el hash:', err);
            rl.close();
            return;
        }

        console.log('✅ Hash generado exitosamente!\n');
        console.log('-'.repeat(60));
        console.log('Contraseña:', password);
        console.log('-'.repeat(60));
        console.log('Hash bcrypt:');
        console.log(hash);
        console.log('-'.repeat(60));
        console.log('\n📋 SCRIPTS SQL PARA ACTUALIZAR LA CONTRASEÑA:\n');

        console.log('1️⃣ Para actualizar por EMAIL:');
        console.log(`UPDATE Usuario SET Clave = '${hash}' WHERE Email = 'tu_email@ejemplo.com';`);

        console.log('\n2️⃣ Para actualizar por CÉDULA:');
        console.log(`UPDATE Usuario SET Clave = '${hash}' WHERE Cedula_Usuario = '00000000001';`);

        console.log('\n3️⃣ Para crear un nuevo ADMINISTRADOR:');
        console.log(`
DECLARE @id_RolAdmin INT;
DECLARE @id_EstadoActivo INT;

SELECT @id_RolAdmin = id_Rol FROM Rol WHERE Rol = 'Administrador';
SELECT @id_EstadoActivo = id_Estado FROM EstadoUsuario WHERE Estado = 'Activo';

INSERT INTO Usuario (id_Rol, id_Estado, Cedula_Usuario, Email, Clave)
VALUES (
    @id_RolAdmin,
    @id_EstadoActivo,
    '00000000001',
    'admin@sistema.com',
    '${hash}'
);
        `);

        console.log('\n' + '='.repeat(60));
        console.log('💡 INSTRUCCIONES:');
        console.log('='.repeat(60));
        console.log('1. Copia uno de los scripts SQL de arriba');
        console.log('2. Abre SQL Server Management Studio o Azure Data Studio');
        console.log('3. Conéctate a tu base de datos SistemaVacunacionDB');
        console.log('4. Pega y ejecuta el script SQL');
        console.log('5. Verifica con: SELECT * FROM Usuario WHERE Email = \'tu_email@ejemplo.com\';');
        console.log('='.repeat(60));
        console.log('');

        rl.close();
    });
});
