const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// GET /active - Get all active vaccine lots
router.get('/active', [verifyToken, checkRole([1, 2, 3])], async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('usp_GetActiveVaccineLots');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error on GET /api/vaccine-lots/active:', err);
        res.status(500).send({ message: 'Failed to retrieve active vaccine lots.', error: err.message });
    }
});

// GET /center/:centerId - Get all vaccine lots for a specific center
// router.get('/center/:centerId', [verifyToken, checkRole([1, 2, 3, 6])], async (req, res) => {
//     try {
//         const { centerId } = req.params;
//         const pool = await poolPromise;
//         const result = await pool.request()
//             .input('id_CentroVacunacion', sql.Int, centerId)
//             .execute('usp_GetVaccineLotsByCenter'); // Assuming this new SP
//         res.json(result.recordset);
//     } catch (err) {
//         console.error(`SQL error on GET /api/vaccine-lots/center/${req.params.centerId}:`, err);
//         res.status(500).send({ message: 'Failed to retrieve vaccine lots for center.', error: err.message });
//     }
// });

router.get('/center/:centerId', [verifyToken, checkRole([1, 2, 3, 6])], async (req, res) => {
    try {
        console.log('------------------------------------------------------------');
        console.log('GET /api/vaccine-lots/center endpoint called');
        console.log('Full user object from token:', JSON.stringify(req.user));
        
        // Security: Always use the center ID from the user's token, not from the URL parameter.
        const centerId = req.user.id_CentroVacunacion;
        console.log('Center ID from token:', centerId, typeof centerId);

        if (!centerId) {
            console.log('Error: No center ID found in user token');
            return res.status(403).send({ message: 'Access denied: No vaccination center associated with this user.' });
        }

        console.log('Connecting to database...');
        const pool = await poolPromise;
        
        // First check if the center even exists
        const centerCheck = await pool.request()
            .input('id', sql.Int, centerId)
            .query('SELECT id_CentroVacunacion, NombreCentro FROM CentroVacunacion WHERE id_CentroVacunacion = @id');
        
        if (centerCheck.recordset.length === 0) {
            console.log(`CRITICAL ERROR: Center ID ${centerId} does not exist in database!`);
            return res.status(404).send({ message: 'The vaccination center associated with your account does not exist in the database.' });
        }
        
        console.log(`Center validated: ${centerCheck.recordset[0].id_CentroVacunacion} - ${centerCheck.recordset[0].NombreCentro}`);
        
        // Now check if we have any lots for this center directly
        const directCheck = await pool.request()
            .input('centerId', sql.Int, centerId)
            .query('SELECT COUNT(*) AS LotCount FROM Lote WHERE id_CentroVacunacion = @centerId');
            
        console.log(`Direct DB check: Center ${centerId} has ${directCheck.recordset[0].LotCount} lots`);

        // Now execute the stored procedure
        console.log('Executing stored procedure usp_GetVaccineLotsByCenter with center ID:', centerId);
        const result = await pool.request()
            .input('id_CentroVacunacion', sql.Int, centerId)
            .execute('usp_GetVaccineLotsByCenter');
        
        console.log('Stored procedure executed. Record count:', result.recordset.length);
        if (result.recordset.length > 0) {
            console.log('First record:', JSON.stringify(result.recordset[0]));
        } else {
            console.log('No records returned from stored procedure.');
        }
        
        // Send the response
        res.json(result.recordset);
        console.log('Response sent to client');
        console.log('------------------------------------------------------------');
    } catch (err) {
        console.error(`SQL error on GET /api/vaccine-lots/center for user ${req.user?.id_Usuario || 'unknown'}:`, err);
        res.status(500).send({ message: 'Failed to retrieve vaccine lots for center.', error: err.message });
    }
});

// POST / - Add a new vaccine lot
router.post('/', [verifyToken, checkRole([1, 2, 6])], async (req, res) => {
    try {
        // **SECURITY FIX**: Use the user's vaccination center ID from the token, not the request body.
        const { id_CentroVacunacion } = req.user; // From verifyToken middleware
        const { id_VacunaCatalogo, NumeroLote, FechaCaducidad, CantidadInicial } = req.body;

        // Validate that the user has an assigned vaccination center in their token
        if (!id_CentroVacunacion) {
            return res.status(403).send({ message: 'Acción no permitida: Su usuario no tiene un centro de vacunación asignado.' });
        }

        // Basic validation for the rest of the fields from the body
        if (!id_VacunaCatalogo || !NumeroLote || !FechaCaducidad || CantidadInicial === undefined) {
            return res.status(400).send({ message: 'Faltan campos requeridos para añadir el lote de vacuna.' });
        }

        const pool = await poolPromise;
        const request = pool.request()
            // Map to the correct stored procedure parameter names
            .input('id_VacunaCatalogo', sql.Int, id_VacunaCatalogo)
            .input('id_CentroVacunacion', sql.Int, id_CentroVacunacion)
            .input('NumeroLote', sql.NVarChar(50), NumeroLote)
            .input('FechaCaducidad', sql.Date, FechaCaducidad)
            .input('CantidadInicial', sql.Int, CantidadInicial)
            // Declare output parameters
            .output('OutputMessage', sql.NVarChar(255))
            .output('New_id_LoteVacuna', sql.Int);
        
        const result = await request.execute('usp_AddVaccineLot');

        const outputMessage = result.output.OutputMessage;
        const newLoteId = result.output.New_id_LoteVacuna;

        if (newLoteId) {
            res.status(201).json({ 
                message: outputMessage, 
                lote: {
                    id_Lote: newLoteId,
                    id_VacunaCatalogo,
                    id_CentroVacunacion,
                    NumeroLote,
                    FechaCaducidad,
                    CantidadInicial
                } 
            });
        } else {
            // The USP handles errors with RAISERROR, which will be caught by the catch block.
            // This is a fallback for unexpected cases.
            res.status(400).send({ message: outputMessage || 'Ocurrió un error al añadir el lote.' });
        }
    } catch (err) {
        // The RAISERROR from the USP is caught here.
        console.error('SQL error on POST /api/vaccine-lots:', err);
        res.status(500).send({ message: err.message || 'Error al añadir el lote de vacuna.' });
    }
});

module.exports = router;
