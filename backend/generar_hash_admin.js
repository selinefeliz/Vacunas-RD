const bcrypt = require('bcrypt');

console.log('========================================');
console.log('Generando hash para Admin123...');
console.log('========================================');
console.log('');

bcrypt.hash('Admin123', 10, (err, hash) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('Contraseña: Admin123');
    console.log('Hash bcrypt:');
    console.log(hash);
    console.log('');
    console.log('========================================');
    console.log('Script SQL para actualizar:');
    console.log('========================================');
    console.log('');
    console.log(`UPDATE Usuario SET Clave = '${hash}' WHERE Email = 'admin@sistema.com';`);
    console.log('');
    console.log('O ejecuta este script completo:');
    console.log('');
    console.log(`
-- Actualizar contraseña del administrador
UPDATE Usuario 
SET Clave = '${hash}' 
WHERE Email = 'admin@sistema.com';

-- Verificar
SELECT id_Usuario, Email, Cedula_Usuario 
FROM Usuario 
WHERE Email = 'admin@sistema.com';
    `);
    console.log('');
    console.log('========================================');
});
