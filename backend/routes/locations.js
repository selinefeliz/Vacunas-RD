const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// GET /provinces - Get all provinces
// Path: /api/locations/provinces
router.get('/provinces', [verifyToken, checkRole([1, 2, 3, 4])], async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('usp_GetProvinces');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error on GET /api/locations/provinces:', err);
        res.status(500).send({ message: 'Database error fetching provinces' });
    }
});

// GET /municipalities/:provinceId - Get municipalities by province
// Path: /api/locations/municipalities/:provinceId
router.get('/municipalities/:provinceId', [verifyToken, checkRole([1, 2, 3, 4])], async (req, res) => {
    try {
        const { provinceId } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_Provincia', sql.Int, provinceId)
            .execute('usp_GetMunicipiosByProvincia');
        res.json(result.recordset);
    } catch (err) {
        console.error(`SQL error on GET /api/locations/municipalities/${req.params.provinceId}:`, err);
        res.status(500).send({ message: 'Database error fetching municipalities' });
    }
});

module.exports = router;
