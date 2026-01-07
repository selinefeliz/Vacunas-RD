const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// POST / - Record a new vaccination
router.post('/', [verifyToken, checkRole([2, 3])], async (req, res) => {
    try {
        const { id_Cita, id_LoteVacuna, FechaAplicacion, EdadAlVacunar, id_PersonalSalud, Observaciones } = req.body;
        const pool = await poolPromise;
        const request = pool.request()
            .input('id_Cita', sql.Int, id_Cita)
            .input('id_LoteVacuna', sql.Int, id_LoteVacuna)
            .input('FechaAplicacion', sql.Date, FechaAplicacion)
            .input('EdadAlVacunar', sql.NVarChar(50), EdadAlVacunar)
            .input('id_PersonalSalud', sql.Int, id_PersonalSalud)
            .input('Observaciones', sql.NVarChar(sql.MAX), Observaciones);
        await request.execute('usp_RecordVaccination');
        res.status(201).json({ message: 'Vaccination recorded successfully.' });
    } catch (err) {
        console.error('SQL error on POST /api/vaccinations:', err);
        res.status(500).send({ message: 'Failed to record vaccination.', error: err.message });
    }
});

module.exports = router;
