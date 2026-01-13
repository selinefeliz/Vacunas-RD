const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/audit-log - Get all audit logs
router.get('/', [verifyToken, checkRole([1])], async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('usp_GetAuditLogs');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error on GET /api/audit-log:', err);
        res.status(500).send({ message: 'Failed to retrieve audit logs.', error: err.message });
    }
});

module.exports = router;
