const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../config/db'); // Assuming db config is in ../config/db

// Middleware (if any specific to these routes, though verifyToken will be applied in index.js)

// POST /api/vaccine-catalog - Add a new vaccine to the catalog
router.post('/', async (req, res) => {
    console.log('[VACCINE CATALOG POST] Request Body:', JSON.stringify(req.body, null, 2));
    const {
        id_Fabricante, Nombre, DosisLimite, Tipo, Descripcion,
        perteneceAlEsquema, edadRecomendadaMeses, intervaloMesesSiguienteDosis, numeroDosisEsquema, esRefuerzo
    } = req.body;

    if (!id_Fabricante || !Nombre) {
        return res.status(400).json({ message: 'id_Fabricante and Nombre are required.' });
    }

    try {
        const pool = await poolPromise;
        console.log('[VACCINE CATALOG POST] Attempting to add vaccine with data:', JSON.stringify(req.body, null, 2));
        const request = pool.request()
            .input('id_Fabricante', sql.Int, id_Fabricante)
            .input('Nombre', sql.NVarChar(100), Nombre)
            .input('DosisLimite', sql.Int, DosisLimite)
            .input('Tipo', sql.NVarChar(50), Tipo)
            .input('Descripcion', sql.NVarChar(sql.MAX), Descripcion)
            .input('PerteneceAlEsquema', sql.Bit, perteneceAlEsquema || 0)
            .input('EdadRecomendadaMeses', sql.Int, edadRecomendadaMeses)
            .input('IntervaloMesesSiguienteDosis', sql.Int, intervaloMesesSiguienteDosis)
            .input('NumeroDosisEsquema', sql.Int, numeroDosisEsquema)
            .input('EsRefuerzo', sql.Bit, esRefuerzo || 0)
            .output('OutputMessage', sql.NVarChar(255))
            .output('New_id_Vacuna', sql.Int);

        const result = await request.execute('dbo.usp_AddVaccineToCatalog');
        console.log('[VACCINE CATALOG POST] Stored Procedure Execution Result:', JSON.stringify(result, null, 2));

        const spOutputMessage = result.output.OutputMessage;
        const newIdVacuna = result.output.New_id_Vacuna;

        // usp_AddVaccineToCatalog uses RAISERROR for validation failures, which are caught by the main CATCH block.
        // If we are here, the SP executed without RAISERROR.
        // We rely on New_id_Vacuna being non-null and OutputMessage indicating success.
        if (newIdVacuna != null && spOutputMessage && spOutputMessage.toLowerCase().includes('success')) {
            res.status(201).json({
                message: spOutputMessage,
                id_Vacuna: newIdVacuna,
                vaccine: { id_Vacuna: newIdVacuna, id_Fabricante, Nombre, DosisLimite, Tipo, Descripcion }
            });
        } else {
            // This case handles scenarios where SP ran, didn't RAISERROR, but didn't return a new ID
            // or the OutputMessage indicates a problem not raised as an error.
            console.error('[VACCINE CATALOG POST] SP executed but did not indicate clear success. OutputMessage:', spOutputMessage, 'New_id_Vacuna:', newIdVacuna);
            res.status(400).json({ message: spOutputMessage || 'Failed to add vaccine to catalog. The operation may not have completed successfully.' });
        }
    } catch (error) {
        console.error('[VACCINE CATALOG POST] CATCH BLOCK - Error executing usp_AddVaccineToCatalog or processing result:', error);
        console.error('[VACCINE CATALOG POST] CATCH BLOCK - Error Name:', error.name);
        console.error('[VACCINE CATALOG POST] CATCH BLOCK - Error Message:', error.message);
        console.error('[VACCINE CATALOG POST] CATCH BLOCK - Error Stack:', error.stack);
        console.error('[VACCINE CATALOG POST] CATCH BLOCK - Full Error Object:', JSON.stringify(error, (key, value) => {
            if (value instanceof Error) {
                return {
                    message: value.message,
                    stack: value.stack,
                    name: value.name,
                    // include other properties if they are important and serializable
                };
            }
            return value;
        }, 2));
        // If the error is from RAISERROR in the SP, it might already be handled by the outputMessage logic
        // This catch block handles other unexpected errors (e.g., DB connection issues)
        if (error.message && error.message.toLowerCase().startsWith('error:')) {
             return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while adding vaccine to catalog.', error: error.message });
    }
});

// GET /api/vaccine-catalog - Get all vaccine catalog entries
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('dbo.usp_GetAllVaccines');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching vaccine catalog:', error);
        res.status(500).json({ message: 'Server error while fetching vaccine catalog.', error: error.message });
    }
});

module.exports = router;
