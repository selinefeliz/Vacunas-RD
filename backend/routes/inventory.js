const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// POST /api/inventory/lots - Registrar un nuevo lote de vacunas
router.post('/lots', [verifyToken, checkRole([1, 6])], async (req, res) => {
    const {
        id_VacunaCatalogo,
        id_CentroVacunacion,
        NumeroLote,
        FechaCaducidad,
        CantidadInicial
    } = req.body;

    // Simple validation
    if (!id_VacunaCatalogo || !id_CentroVacunacion || !NumeroLote || !FechaCaducidad || !CantidadInicial) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_VacunaCatalogo', sql.Int, id_VacunaCatalogo)
            .input('id_CentroVacunacion', sql.Int, id_CentroVacunacion)
            .input('NumeroLote', sql.NVarChar(100), NumeroLote)
            .input('FechaCaducidad', sql.Date, FechaCaducidad)
            .input('CantidadInicial', sql.Int, CantidadInicial)
            .execute('usp_AddLote');

        res.status(201).json({ message: 'Lote registrado exitosamente.', loteId: result.recordset[0].NuevoLoteID });
    } catch (error) {
        console.error('Error al registrar el lote:', error);
        res.status(500).json({ message: 'Error al registrar el lote', error: error.message });
    }
});

// GET /api/inventory/lots/center/:centerId - Obtener lotes por centro de vacunación
router.get('/lots/center/:centerId', [verifyToken, checkRole([1, 6])], async (req, res) => {
    const { centerId } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_CentroVacunacion', sql.Int, centerId)
            .execute('usp_GetLotesPorCentro');

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error al obtener los lotes:', error);
        res.status(500).json({ message: 'Error al obtener los lotes', error: error.message });
    }
});

module.exports = router;
