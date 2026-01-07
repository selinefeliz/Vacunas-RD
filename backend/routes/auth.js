const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../config/db');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { LoginIdentifier: email } = req.body;
    const password = req.body.Password || req.body.password;

    if (!email || !password) {
        return res.status(400).send({ message: 'Login identifier and password are required.' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('LoginIdentifier', sql.NVarChar, email)
            .execute('usp_GetUserForAuth');

        console.log(`[API Auth] Received LoginIdentifier: '${email}'`);
        console.log(`[API Auth] User found by usp_GetUserForAuth: ${result.recordset.length > 0}`);

        if (result.recordset.length === 0) {
            console.log(`[API Auth] Login failed: No active user found for LoginIdentifier '${email}'`);
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
                id_CentroVacunacion: user.id_CentroVacunacion 
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send({ message: 'Server error during login.' });
    }
});

module.exports = router;
