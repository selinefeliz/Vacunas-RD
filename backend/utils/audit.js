const { sql, poolPromise } = require('../config/db');

async function logAudit(req, action, resource, resourceId, details) {
    try {
        const pool = await poolPromise;

        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : 'System/Anonymous';
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        await pool.request()
            .input('id_Usuario', sql.Int, userId)
            .input('Usuario', sql.NVarChar(100), userEmail)
            .input('Accion', sql.NVarChar(50), action)
            .input('Recurso', sql.NVarChar(50), resource)
            .input('id_Recurso', sql.NVarChar(50), String(resourceId))
            .input('Detalles', sql.NVarChar(sql.MAX), details)
            .input('DireccionIP', sql.NVarChar(50), ip)
            .execute('usp_CreateAuditLog');

        console.log(`[AUDIT] ${action} on ${resource} ${resourceId} by ${userEmail}`);
    } catch (err) {
        console.error('Failed to write audit log:', err);
        // Don't fail the request if audit logging fails
    }
}

module.exports = { logAudit };
