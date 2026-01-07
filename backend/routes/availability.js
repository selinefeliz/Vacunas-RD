const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/availability - Add a new availability slot
router.post('/', [verifyToken, checkRole([1, 6])], async (req, res) => {
    try {
        // --- Manual Validation and Parsing Layer ---
        console.log(`[${new Date().toISOString()}] Received POST /api/availability with body:`, JSON.stringify(req.body));

        const { id_CentroVacunacion, Fecha, HoraInicio, HoraFin, CuposTotales } = req.body;

        // 1. Check for presence of all fields
        if (id_CentroVacunacion === undefined || Fecha === undefined || HoraInicio === undefined || HoraFin === undefined || CuposTotales === undefined) {
            console.error('[VALIDATION FAILED] Missing one or more required fields.');
            return res.status(400).send({ message: 'All fields are required and cannot be empty.' });
        }

        // 2. Manually parse numbers
        const centerId = parseInt(id_CentroVacunacion, 10);
        const totalSlots = parseInt(CuposTotales, 10);

        if (isNaN(centerId) || isNaN(totalSlots) || centerId <= 0 || totalSlots <= 0) {
            console.error(`[VALIDATION FAILED] Invalid number format. Parsed centerId: ${centerId}, totalSlots: ${totalSlots}`);
            return res.status(400).send({ message: 'Vaccination Center ID and Total Slots must be positive numbers.' });
        }
        
        // 3. Validate date and time formats (simple regex check)
        // Assumes frontend sends date as YYYY-MM-DD and time as HH:MM
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const timeRegex = /^\d{2}:\d{2}$/;

        if (!dateRegex.test(Fecha) || !timeRegex.test(HoraInicio) || !timeRegex.test(HoraFin)) {
            console.error(`[VALIDATION FAILED] Invalid date/time format. Fecha: ${Fecha}, HoraInicio: ${HoraInicio}, HoraFin: ${HoraFin}`);
            return res.status(400).send({ message: 'Invalid format for Date (YYYY-MM-DD), Start Time (HH:MI), or End Time (HH:MI).' });
        }

        console.log('[VALIDATION PASSED] Data is well-formed. Proceeding to database operation.');
        // --- End of Validation Layer ---

        const pool = await poolPromise;
        await pool.request()
            .input('id_CentroVacunacion', sql.Int, centerId)
            .input('Fecha', sql.VarChar(10), Fecha) // Pass as VARCHAR (YYYY-MM-DD)
            .input('HoraInicio', sql.VarChar(8), `${HoraInicio}:00`) // Pass as VARCHAR (HH:MI:SS)
            .input('HoraFin', sql.VarChar(8), `${HoraFin}:00`)       // Pass as VARCHAR (HH:MI:SS)
            .input('CuposTotales', sql.Int, totalSlots)
            .execute('usp_AddAvailability');

        res.status(201).send({ message: 'Availability slot created successfully.' });
    } catch (err) {
        console.error('--- DETAILED SQL ERROR on POST /api/availability ---');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Request Body:', JSON.stringify(req.body, null, 2));
        console.error('Full Error Object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
        console.error('----------------------------------------------------');
        res.status(500).send({ 
            message: 'Failed to create availability slot. Check backend logs for details.', 
            error: err.message,
            sqlErrorCode: err.code, // mssql driver specific
            sqlErrorNumber: err.number // mssql driver specific
        });
    }
});

// GET /api/availability/center/:centerId - Get availability slots by center ID
// GET /api/availability/center/:centerId - Get availability for a specific vaccination center
router.get('/center/:centerId', [verifyToken, checkRole([1, 6])], async (req, res) => {
    try {
        const { centerId } = req.params;
        const parsedCenterId = parseInt(centerId, 10);

        if (isNaN(parsedCenterId) || parsedCenterId <= 0) {
            return res.status(400).send({ message: 'Vaccination center ID is missing or invalid.' });
        }

        const pool = await poolPromise;
        const availabilityResult = await pool.request()
            .input('id_CentroVacunacion', sql.Int, parsedCenterId)
            .execute('usp_GetAvailabilityForCenter');
        
        res.status(200).json(availabilityResult.recordset);

    } catch (err) {
        console.error('--- DETAILED SQL ERROR on GET /api/availability/center/:centerId ---');
        console.error('Timestamp:', new Date().toISOString());
        console.error('User:', JSON.stringify(req.user, null, 2)); // req.user is available due to verifyToken
        console.error('Params:', JSON.stringify(req.params, null, 2));
        console.error('Full Error Object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
        console.error('-------------------------------------------------------------');
        res.status(500).send({
            message: 'Failed to retrieve availability data. See error for details.',
            error: err.message, // Send the actual SQL error message back
            sqlErrorCode: err.code, // mssql driver specific
            sqlErrorNumber: err.number // mssql driver specific
        });
    }
});

module.exports = router;
