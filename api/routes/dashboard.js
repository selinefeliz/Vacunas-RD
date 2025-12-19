const express = require('express');
const router = express.Router();

const { poolConnect, sql } = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// GET /stats - Get dashboard statistics
router.get('/stats', [verifyToken, checkRole([1, 2, 3, 4])], async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('usp_GetDashboardStats');
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('SQL error on GET /api/dashboard/stats:', err);
        res.status(500).send({ message: 'Failed to retrieve dashboard stats.', error: err.message });
    }
});

// GET /alerts - Get dashboard alerts
router.get('/alerts', [verifyToken, checkRole([1, 2, 3, 4])], async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('usp_GetDashboardAlerts');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error on GET /api/dashboard/alerts:', err);
        res.status(500).send({ message: 'Failed to retrieve dashboard alerts.' });
    }
});

// GET /appointments - Get upcoming appointments
router.get('/appointments', [verifyToken, checkRole([1, 2, 3, 4])], async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('usp_GetDashboardAppointments');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error on GET /api/dashboard/appointments:', err);
        res.status(500).send({ message: 'Failed to retrieve dashboard appointments.' });
    }
});

module.exports = router;
