const express = require('express');
const { poolPromise } = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/roles - Get all user roles
router.get('/', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('usp_GetRoles');
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error on GET /api/roles:', err);
    res.status(500).send({ message: 'Failed to retrieve roles.', error: err.message });
  }
});

module.exports = router;
