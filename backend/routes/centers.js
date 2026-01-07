const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/vaccination-centers - Get all vaccination centers
router.get('/', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('usp_GetAllVaccinationCenters');

    console.log('Raw data from DB:', JSON.stringify(result.recordset, null, 2));

    // Map database columns to frontend-friendly keys to avoid breaking the client
    const centers = result.recordset.map(center => ({
      id_CentroVacunacion: center.id_CentroVacunacion,
      Nombre: center.NombreCentro, // Aliasing from DB name to frontend name
      Direccion: center.Direccion,
      Provincia: center.Provincia,
      Municipio: center.Municipio,
      Telefono: center.Telefono,
      Director: center.Director,
      Web: center.Web,
      Capacidad: center.Capacidad,
      Estado: center.NombreEstado // Corrected to match the final stored procedure
    }));

    res.json(centers);
  } catch (err) {
    console.error('SQL error on GET /api/vaccination-centers:', err);
    res.status(500).send({ message: 'Failed to retrieve vaccination centers.', error: err.message });
  }
});

// GET /api/vaccination-centers/statuses - Get all possible center statuses
router.get('/statuses', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('usp_GetCenterStatuses');
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error on GET /api/vaccination-centers/statuses:', err);
    res.status(500).send({ message: 'Failed to retrieve center statuses.', error: err.message });
  }
});

// POST /api/vaccination-centers - Create a new vaccination center
router.post('/', [verifyToken, checkRole([1])], async (req, res) => {
  try {
    const {
      Nombre, Director, Direccion, id_Provincia, id_Municipio,
      Telefono, URLGoogleMaps, Capacidad, id_Estado
    } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input('NombreCentro', sql.NVarChar, Nombre)
      .input('Direccion', sql.NVarChar, Direccion)
      .input('id_Provincia', sql.NVarChar, id_Provincia)
      .input('id_Municipio', sql.NVarChar, id_Municipio)
      .input('Telefono', sql.NVarChar, Telefono)
      .input('Director', sql.NVarChar, Director)
      .input('Web', sql.NVarChar, URLGoogleMaps)
      .input('Capacidad', sql.Int, Capacidad)
      .input('id_Estado', sql.Int, id_Estado)
      .execute('usp_CreateVaccinationCenter');

    res.status(201).send({ message: 'Vaccination center created successfully.' });
  } catch (err) {
    console.error('SQL error on POST /api/vaccination-centers:', err);
    res.status(500).send({ message: 'Failed to create vaccination center.', error: err.message });
  }
});

// PUT /api/vaccination-centers/:id - Update a vaccination center
router.put('/:id', [verifyToken, checkRole([1])], async (req, res) => {
  try {
    const { id } = req.params;
    const {
      Nombre, Director, Direccion, id_Provincia, id_Municipio,
      Telefono, URLGoogleMaps, Capacidad, id_Estado
    } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input('id_CentroVacunacion', sql.Int, id)
      .input('NombreCentro', sql.NVarChar, Nombre)
      .input('Direccion', sql.NVarChar, Direccion)
      .input('id_Provincia', sql.NVarChar, id_Provincia)
      .input('id_Municipio', sql.NVarChar, id_Municipio)
      .input('Telefono', sql.NVarChar, Telefono)
      .input('Director', sql.NVarChar, Director)
      .input('Web', sql.NVarChar, URLGoogleMaps)
      .input('Capacidad', sql.Int, Capacidad)
      .input('id_Estado', sql.Int, id_Estado)
      .execute('usp_UpdateVaccinationCenter');

    res.status(200).send({ message: 'Vaccination center updated successfully.' });
  } catch (err) {
    console.error('SQL error on PUT /api/vaccination-centers/:id:', err);
    res.status(500).send({ message: 'Failed to update vaccination center.', error: err.message });
  }
});

// DELETE /:id - Soft delete a vaccination center (set status to Inactivo)
router.delete('/:id', [verifyToken, checkRole([1])], async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input('id_CentroVacunacion', sql.Int, id)
      .execute('usp_DeactivateVaccinationCenter');

    res.status(200).send({ message: 'Vaccination center deactivated successfully.' });
  } catch (err) {
    console.error('SQL error on DELETE /api/vaccination-centers/:id:', err);
    res.status(500).send({ message: 'Failed to deactivate vaccination center.', error: err.message });
  }
});

module.exports = router;
