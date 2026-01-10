const express = require('express');
const bcrypt = require('bcrypt');
const { sql, poolPromise } = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Vaccine Endpoints ---

// GET /api/vaccines - Get all vaccines
router.get('/vaccines', verifyToken, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('usp_GetAllVaccines');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error on GET /api/vaccines:', err);
        res.status(500).send({ message: 'Failed to retrieve vaccines.', error: err.message });
    }
});

// --- Tutor Endpoints ---
// POST /api/tutors - Register a new Tutor and associated User with a hashed password
router.post('/tutors', async (req, res) => {
    console.log(`[ROUTE HANDLER] POST /api/tutors reached in other.js`); // <-- ADD THIS LOG
    console.log(`Accessed POST /api/tutors with body: ${JSON.stringify(req.body)}`);

    const { Nombres, Apellidos, TipoIdentificacion, NumeroIdentificacion, Telefono, Direccion, Email, Username, FechaNacimiento } = req.body;
    const password = req.body.Password || req.body.password;

    if (!Nombres || !Apellidos || !NumeroIdentificacion || !Email || !password || !Username) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Cedula_Tutor', sql.NVarChar(15), NumeroIdentificacion)
            .input('Nombres_Tutor', sql.NVarChar(100), Nombres)
            .input('Apellidos_Tutor', sql.NVarChar(100), Apellidos)
            .input('Telefono_Tutor', sql.NVarChar(20), Telefono)
            .input('Email_Tutor', sql.NVarChar(100), Email)
            .input('Direccion_Tutor', sql.NVarChar(200), Direccion)
            .input('FechaNacimiento', sql.Date, FechaNacimiento || null) // Added parameter
            .input('Email_Usuario', sql.NVarChar(100), Email)
            .input('Username', sql.NVarChar(100), Username)
            .input('Clave_Usuario', sql.NVarChar(255), hashedPassword)
            .output('OutputMessage', sql.NVarChar(255))
            .output('New_id_Usuario', sql.Int)
            .output('New_id_Tutor', sql.Int)
            .execute('usp_RegisterTutor');

        res.status(201).json({
            message: result.output.OutputMessage || 'Tutor registered successfully.',
            userId: result.output.New_id_Usuario,
            tutorId: result.output.New_id_Tutor
        });

    } catch (err) {
        console.error('SQL error on POST /api/tutors:', err);
        const errorMessage = err.originalError?.info?.message || err.message;
        res.status(500).send({ message: 'Failed to register tutor.', error: errorMessage });
    }
});

// GET /api/tutors/:userId/children - Get all children associated with a tutor's user ID
router.get('/tutors/:userId/children', [verifyToken, checkRole([1, 5])], async (req, res) => {
    try {
        const { userId } = req.params;
        const { id: requestingUserId, id_Rol: requestingUserRole } = req.user;

        // Security check: Tutors can only view their own children.
        if (requestingUserRole === 5 && requestingUserId.toString() !== userId) {
            return res.status(403).send({ message: 'Forbidden: You can only view your own children.' });
        }

        const pool = await poolPromise;

        // First, find the id_Tutor from the id_Usuario (userId)
        const tutorResult = await pool.request()
            .input('id_Usuario', sql.Int, userId)
            .query('SELECT id_Tutor FROM Tutor WHERE id_Usuario = @id_Usuario');

        if (tutorResult.recordset.length === 0) {
            return res.status(404).send({ message: 'Tutor not found for the given user ID.' });
        }

        const tutorId = tutorResult.recordset[0].id_Tutor;

        // Now, get the children using the correct id_Tutor
        const childrenResult = await pool.request()
            .input('id_Tutor', sql.Int, tutorId)
            .execute('usp_GetNinosByTutor');

        res.json(childrenResult.recordset);

    } catch (err) {
        console.error(`SQL error on GET /api/tutors/${req.params.userId}/children:`, err);
        res.status(500).send({ message: 'Failed to retrieve children.', error: err.message });
    }
});

module.exports = router;
