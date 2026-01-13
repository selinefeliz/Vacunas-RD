const express = require('express');
const router = express.Router();
const { sql, connectDB } = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// --- Specific Routes First ---

// GET /find - Search for children by name/lastname (Medical/Admin only)
router.get('/find', [verifyToken, checkRole([1, 2, 3])], async (req, res) => {
    try {
        const { q, id_centro } = req.query;
        // Allow empty search to return list
        const searchTerm = q ? `%${q}%` : '%';
        const centerId = id_centro ? parseInt(id_centro) : null;

        console.log('[DEBUG] GET /find - Query:', { searchTerm, centerId });

        const pool = await connectDB();
        const request = pool.request();
        request.input('searchTerm', sql.NVarChar(100), searchTerm);

        let query = `
            SELECT DISTINCT TOP 20 
                n.id_Nino, 
                n.Nombres, 
                n.Apellidos, 
                n.FechaNacimiento, 
                n.Genero, 
                n.DireccionResidencia,
                t.id_Usuario AS id_Tutor_Usuario,
                t.Nombres AS NombreTutor,
                t.Apellidos AS ApellidoTutor
            FROM dbo.Nino n
            LEFT JOIN dbo.TutorNino tn ON n.id_Nino = tn.id_Nino
            LEFT JOIN dbo.Tutor t ON tn.id_Tutor = t.id_Tutor
        `;

        // If filtering by center, we only want patients who have HAD history (CitaVacunacion) in that center
        if (centerId) {
            query += ` JOIN dbo.CitaVacunacion cv ON n.id_Nino = cv.id_Nino `;
        }

        query += `
            WHERE ((n.Nombres LIKE @searchTerm OR n.Apellidos LIKE @searchTerm)
               OR (t.Nombres LIKE @searchTerm OR t.Apellidos LIKE @searchTerm))
        `;

        if (centerId) {
            request.input('id_centro', sql.Int, centerId);
            query += ` AND cv.id_CentroVacunacion = @id_centro `;
        }

        query += ` ORDER BY n.Nombres, n.Apellidos `;

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (err) {
        console.error('[NINOS] Error on GET /find:', err);
        res.status(500).send({ message: 'Error al buscar niños.', error: err.message });
    }
});

// POST / - Register a new child
router.post('/', [verifyToken, checkRole([5, 1])], async (req, res) => {
    try {
        const { Nombres, Apellidos, Genero, FechaNacimiento, DireccionResidencia } = req.body;
        const id_Usuario = req.user.id; // Get user ID from authenticated user

        console.log('[NINOS] POST / - Starting registration for user:', id_Usuario);
        console.log('[NINOS] Body data:', { Nombres, Apellidos, Genero, FechaNacimiento, DireccionResidencia });

        const pool = await connectDB();
        if (!pool) {
            console.error('[NINOS] Pool connection is undefined');
            return res.status(500).send({ message: 'Error de conexión a la base de datos.' });
        }

        const tutorRequest = pool.request();
        tutorRequest.input('id_Usuario', sql.Int, id_Usuario);
        const tutorResult = await tutorRequest.query('SELECT id_Tutor FROM Tutor WHERE id_Usuario = @id_Usuario');

        if (tutorResult.recordset.length === 0) {
            return res.status(400).send({ message: 'Usuario no encontrado como tutor.' });
        }

        const id_Tutor = tutorResult.recordset[0].id_Tutor;

        const ninoRequest = pool.request();
        ninoRequest.input('id_Tutor', sql.Int, id_Tutor);
        ninoRequest.input('Nombres_Nino', sql.NVarChar(100), Nombres);
        ninoRequest.input('Apellidos_Nino', sql.NVarChar(100), Apellidos);
        ninoRequest.input('Genero_Nino', sql.Char(1), Genero);
        ninoRequest.input('FechaNacimiento_Nino', sql.Date, FechaNacimiento);
        ninoRequest.input('DireccionResidencia_Nino', sql.NVarChar(200), DireccionResidencia);

        const result = await ninoRequest.execute('usp_RegisterNino');

        console.log('[NINOS] DB Result received:', JSON.stringify({
            hasRecordset: !!result.recordset,
            recordsetLength: result.recordset?.length,
            hasRecordsets: !!result.recordsets,
            recordsetsCount: result.recordsets?.length
        }));

        // Try multiple ways to get the data (Azure sometimes uses recordsets[0])
        let childData = null;
        if (result.recordset && result.recordset.length > 0) {
            childData = result.recordset[0];
        } else if (result.recordsets && result.recordsets[0] && result.recordsets[0].length > 0) {
            childData = result.recordsets[0][0];
        }

        if (!childData) {
            console.warn('[NINOS] Caution: No child data in result sets. Inspecting output params...', result.output);
            // Fallback to output parameters if procedure didn't return a recordset
            if (result.output && result.output.ActivationCode) {
                childData = { ActivationCode: result.output.ActivationCode };
            }
        }

        if (!childData) {
            console.error('[NINOS] Critical: Failed to retrieve registration data for child.');
            return res.status(201).json({
                message: 'Niño registrado (verificar en lista).',
                CodigoActivacion: 'Disponible en perfil'
            });
        }

        res.status(201).json({
            message: 'Niño registrado exitosamente.',
            CodigoActivacion: childData.ActivationCode || childData.ActivationCode_Nino || 'Disponible en perfil',
            data: childData
        });
    } catch (err) {
        console.error('[NINOS] SQL error on POST /api/ninos:', err);
        console.error('[NINOS] Error stack:', err.stack);
        res.status(500).send({ message: 'Error al registrar el niño.', error: err.message });
    }
});

// GET /link-requests - Get pending link requests for current tutor
router.get('/link-requests', [verifyToken, checkRole([5, 1])], async (req, res) => {
    try {
        const id_Usuario = req.user.id;
        console.log('[NINOS] GET /link-requests - User ID from token:', id_Usuario, 'Type:', typeof id_Usuario);

        if (typeof id_Usuario !== 'number' || isNaN(id_Usuario)) {
            return res.status(400).send({ message: 'Invalid user identifier in token.' });
        }

        const pool = await connectDB();
        const result = await pool.request()
            .input('id_Usuario_param', sql.Int, id_Usuario)
            .query('EXEC usp_ObtenerSolicitudesVinculacion @id_Usuario = @id_Usuario_param');

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('[NINOS] Error on GET /link-requests:', err);
        console.error('[NINOS] Error stack:', err.stack);
        res.status(500).send({ message: 'Error al obtener solicitudes de vinculación.', error: err.message });
    }
});

// POST /request-link - Request to link child to tutor (new system)
router.post('/request-link', [verifyToken, checkRole([5, 1])], async (req, res) => {
    try {
        const { CodigoActivacion, MensajePersonalizado } = req.body;
        const id_Usuario = req.user.id;

        if (!CodigoActivacion) {
            return res.status(400).send({ message: 'El código de activación es requerido.' });
        }

        const pool = await connectDB();
        const result = await pool.request()
            .input('id_Usuario', sql.Int, id_Usuario)
            .input('CodigoActivacion', sql.NVarChar(20), CodigoActivacion)
            .input('MensajePersonalizado', sql.NVarChar(500), MensajePersonalizado)
            .execute('usp_SolicitarVinculacion');

        res.status(200).json({
            message: 'Solicitud de vinculación enviada exitosamente.',
            data: result.recordset[0]
        });
    } catch (err) {
        console.error('[NINOS] Error on POST /request-link:', err);
        if (err.message.includes('Ya estás vinculado') || err.message.includes('Ya tienes una solicitud') || err.message.includes('Código de activación no válido')) {
            return res.status(400).send({ message: err.message });
        }
        res.status(500).send({ message: 'Error al enviar solicitud de vinculación.', error: err.message });
    }
});

// POST /respond-link-request/:requestId - Accept or reject link request
router.post('/respond-link-request/:requestId', [verifyToken, checkRole([5, 1])], async (req, res) => {
    try {
        const requestId = parseInt(req.params.requestId);
        const { action } = req.body;
        const id_Usuario = req.user.id;

        if (isNaN(requestId)) {
            return res.status(400).send({ message: 'ID de solicitud inválido.' });
        }
        if (!action || (action !== 'Aceptar' && action !== 'Rechazar')) {
            return res.status(400).send({ message: 'Acción inválida. Use "Aceptar" o "Rechazar".' });
        }

        const pool = await connectDB();
        const result = await pool.request()
            .input('id_Solicitud', sql.Int, requestId)
            .input('id_Usuario', sql.Int, id_Usuario)
            .input('Accion', sql.NVarChar(10), action)
            .execute('usp_ResponderSolicitudVinculacion');

        res.status(200).json({
            message: result.recordset[0].mensaje,
            success: true
        });
    } catch (err) {
        console.error('[NINOS] Error on POST /respond-link-request:', err);
        if (err.message.includes('Solicitud no encontrada') || err.message.includes('sin permisos')) {
            return res.status(403).send({ message: err.message });
        }
        res.status(500).send({ message: 'Error al responder solicitud.', error: err.message });
    }
});

// GET /tutor/:tutorId/detailed - Get detailed children info for tutor
router.get('/tutor/:tutorId/detailed', [verifyToken, checkRole([5, 1])], async (req, res) => {
    try {
        const tutorId = parseInt(req.params.tutorId);
        if (isNaN(tutorId)) {
            return res.status(400).send({ message: 'ID de tutor inválido.' });
        }

        const pool = await connectDB();
        const result = await pool.request()
            .input('id_Usuario', sql.Int, tutorId)
            .execute('usp_GetNinosDetalladosPorTutor');

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('[NINOS] Error on GET /tutor/:tutorId/detailed:', err);
        res.status(500).send({ message: 'Error al obtener información detallada de niños.', error: err.message });
    }
});

// --- Dynamic Routes (MUST BE LAST & IN ORDER) ---

// GET /:id/vaccination-schedule - Get the calculated vaccination schedule for a child
// IMPORTANT: This route must be defined before the generic '/:id' route to avoid conflicts.
router.get('/:id/vaccination-schedule', [verifyToken, checkRole([1, 2, 5])], async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).send({ message: 'A valid Child ID is required.' });
    }

    try {
        const pool = await connectDB();
        const request = new sql.Request(pool);
        request.input('id_Nino', sql.Int, id);

        const result = await request.execute('dbo.usp_CalcularEsquemaVacunacionNino');

        res.status(200).json(result.recordset);

    } catch (err) {
        console.error('Error executing usp_CalcularEsquemaVacunacionNino:', err);
        res.status(500).send({
            message: 'Error fetching vaccination schedule.',
            error: err.message
        });
    }
});

// GET /:ninoId/appointments - Get appointments for a specific child
router.get('/:ninoId/appointments', [verifyToken, checkRole([1, 2, 5])], async (req, res) => {
    try {
        const { ninoId } = req.params;
        const pool = await connectDB();
        const result = await pool.request()
            .input('id_Nino', sql.Int, ninoId)
            .execute('usp_GetAppointmentsByNino');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error on GET /api/ninos/:ninoId/appointments:', err);
        res.status(500).send({ message: 'Failed to retrieve appointments.', error: err.message });
    }
});

// GET /:id - Get details for a specific child
router.get('/:id', [verifyToken, checkRole([1, 2, 5])], async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).send({ message: 'INVALID CHILD ID (FALLTHROUGH)' });
        }

        const pool = await connectDB();
        const result = await pool.request()
            .input('id_Nino', sql.Int, id)
            .execute('usp_GetNinoDetailsById');

        if (result.recordset.length === 0) {
            return res.status(404).send({ message: 'Nino not found.' });
        }
        res.json(result.recordset[0]);

    } catch (err) {
        console.error('SQL error on GET /api/ninos/:id:', err);
        res.status(500).send({ message: 'Error al obtener los detalles del niño.', error: err.message });
    }
});

// PUT /:id - Update a child's record
router.put('/:id', [verifyToken, checkRole([1, 2])], async (req, res) => {
    try {
        const { id } = req.params;
        const { Nombres, Apellidos, FechaNacimiento, Genero, CodigoIdentificacionPropio, id_CentroSaludAsignado } = req.body;

        const pool = await connectDB();
        await pool.request()
            .input('id_Nino', sql.Int, id)
            .input('Nombres', sql.NVarChar(100), Nombres)
            .input('Apellidos', sql.NVarChar(100), Apellidos)
            .input('FechaNacimiento', sql.Date, FechaNacimiento)
            .input('Genero', sql.Char(1), Genero)
            .input('CodigoIdentificacionPropio', sql.NVarChar(20), CodigoIdentificacionPropio)
            .input('id_CentroSaludAsignado', sql.Int, id_CentroSaludAsignado)
            .execute('usp_UpdateNino');

        res.status(200).send({ message: 'Child record updated successfully.' });
    } catch (err) {
        console.error('SQL error on PUT /api/ninos/:id:', err);
        res.status(500).send({ message: 'Failed to update child record.', error: err.message });
    }
});

// DELETE /:id - Delete a child's record
router.delete('/:id', [verifyToken, checkRole([1])], async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await connectDB();
        await pool.request()
            .input('id_Nino', sql.Int, id)
            .execute('usp_DeleteNino');

        res.status(200).send({ message: 'Child record deleted successfully.' });
    } catch (err) {
        console.error('SQL error on DELETE /api/ninos/:id:', err);
        res.status(500).send({ message: 'Failed to delete child record.', error: err.message });
    }
});

module.exports = router;
