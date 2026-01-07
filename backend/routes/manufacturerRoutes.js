const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../config/db');

// GET /api/manufacturers - Get all manufacturers
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const query = 'SELECT id_Fabricante, Fabricante FROM dbo.Fabricante ORDER BY Fabricante;';
        const result = await pool.request().query(query);
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching manufacturers:', error);
        res.status(500).json({ message: 'Server error while fetching manufacturers.', error: error.message });
    }
});

module.exports = router;
