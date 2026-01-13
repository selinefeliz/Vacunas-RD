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
        CantidadInicial,
        CantidadMinimaAlerta,
        CantidadMaximaCapacidad
    } = req.body;

    // Simple validation
    if (!id_VacunaCatalogo || !id_CentroVacunacion || !NumeroLote || !FechaCaducidad || !CantidadInicial) {
        return res.status(400).json({ message: 'Todos los campos básicos son obligatorios.' });
    }

    // Server-side validation for range rule (optional, as SP does it too, but good for faster feedback)
    if (CantidadMaximaCapacidad && CantidadInicial > CantidadMaximaCapacidad) {
        return res.status(400).json({ message: 'La cantidad inicial no puede exceder la capacidad máxima.' });
    }
    if (CantidadMinimaAlerta && CantidadInicial < CantidadMinimaAlerta) {
        return res.status(400).json({ message: 'La cantidad inicial no puede ser menor a la cantidad mínima de alerta.' });
    }

    // Explicitly parse thresholds to numbers or defaults
    const parsedMin = (CantidadMinimaAlerta !== undefined && CantidadMinimaAlerta !== null && CantidadMinimaAlerta !== "") ? parseInt(CantidadMinimaAlerta, 10) : 10;
    const parsedMax = (CantidadMaximaCapacidad !== undefined && CantidadMaximaCapacidad !== null && CantidadMaximaCapacidad !== "") ? parseInt(CantidadMaximaCapacidad, 10) : null;

    // Debug log
    console.log('POST /lots processed values:', { id_VacunaCatalogo, id_CentroVacunacion, NumeroLote, FechaCaducidad, CantidadInicial, parsedMin, parsedMax });

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_VacunaCatalogo', sql.Int, id_VacunaCatalogo)
            .input('id_CentroVacunacion', sql.Int, id_CentroVacunacion)
            .input('NumeroLote', sql.NVarChar(100), NumeroLote)
            .input('FechaCaducidad', sql.Date, FechaCaducidad)
            .input('CantidadInicial', sql.Int, CantidadInicial)
            .input('CantidadMinimaAlerta', sql.Int, parsedMin)
            .input('CantidadMaximaCapacidad', sql.Int, parsedMax)
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
