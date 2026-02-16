const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../config/db');

const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/auth/change-password
router.post('/change-password', verifyToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Both current and new passwords are required.' });
    }

    // Complexity Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            message: 'La contraseña debe tener al menos 12 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.'
        });
    }

    try {
        const pool = await poolPromise;

        // 1. Get current password hash
        const result = await pool.request()
            .input('id_Usuario', sql.Int, userId)
            .query('SELECT Clave FROM Usuario WHERE id_Usuario = @id_Usuario');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = result.recordset[0];

        // 2. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.Clave);
        if (!isMatch) {
            return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
        }

        // 3. Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // 4. Update password
        await pool.request()
            .input('id_Usuario', sql.Int, userId)
            .input('NewPassword', sql.NVarChar(255), hashedPassword)
            .query('UPDATE Usuario SET Clave = @NewPassword WHERE id_Usuario = @id_Usuario');

        res.json({ message: 'Contraseña actualizada exitosamente.' });

    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ message: 'Server error updating password.' });
    }
});

const { validateEmail } = require('../utils/validation');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { LoginIdentifier: email } = req.body;
    const password = req.body.Password || req.body.password;

    if (!email || !password) {
        return res.status(400).send({ message: 'Login identifier and password are required.' });
    }

    if (!validateEmail(email)) {
        return res.status(400).send({ message: 'Invalid email format.' });
    }

    if (password.length > 100) {
        return res.status(400).send({ message: 'Password is too long.' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('LoginIdentifier', sql.NVarChar, email)
            .execute('usp_GetUserForAuth');

        if (result.recordset.length === 0) {
            return res.status(401).send({ message: 'Invalid credentials or user is inactive.' });
        }


        const user = result.recordset[0];

        const passwordMatch = await bcrypt.compare(password, user.Clave);
        if (!passwordMatch) {
            return res.status(401).send({ message: 'Invalid credentials.' });
        }

        // Security check: Ensure users who need a center have one assigned.
        if (user.id_Rol === 6 && !user.id_CentroVacunacion) {
            console.warn(`[API Auth] Login blocked for user ${user.id_Usuario} (Role 6) due to missing vaccination center assignment.`);
            return res.status(403).send({ message: 'Access denied: Your account is not associated with a vaccination center. Please contact an administrator.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id_Usuario, email: user.Email, role: user.NombreRol, id_Rol: user.id_Rol, id_CentroVacunacion: user.id_CentroVacunacion },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id_Usuario,
                email: user.Email,
                role: user.NombreRol,
                id_Rol: user.id_Rol,
                id_CentroVacunacion: user.id_CentroVacunacion,
                NombreCentro: user.NombreCentro // Added for automated context setting
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send({ message: 'Server error during login.' });
    }
});

module.exports = router;
