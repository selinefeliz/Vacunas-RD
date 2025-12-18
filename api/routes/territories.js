const express = require('express');
const router = express.Router();

/**
 * Proxy para la API Territorial de OGTIC (Dominican Republic)
 * Evita CORS y centraliza las consultas de provincias y municipios.
 */

// Obtener Provincias
router.get('/provinces', async (req, res) => {
    try {
        console.log('[TERRITORY DEBUG] Fetching provinces from OGTIC API...');
        const response = await fetch('https://api.digital.gob.do/v1/territories/provinces', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        const data = await response.json();

        if (data.valid && data.data) {
            // Aseguramos que data.data sea un array antes de ordenar
            const provinces = Array.isArray(data.data) ? data.data : [data.data];
            const sortedProvinces = provinces.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            return res.json(sortedProvinces);
        }

        res.status(400).json({ message: 'API Territorial no devolvió datos válidos.' });
    } catch (error) {
        console.error('[TERRITORY ERROR] provinces:', error);
        res.status(500).json({ message: 'Error al conectar con la API Territorial.' });
    }
});

// Obtener Municipios por Código de Provincia
router.get('/municipalities', async (req, res) => {
    try {
        const { provinceCode } = req.query;
        if (!provinceCode) {
            return res.status(400).json({ message: 'Se requiere provinceCode.' });
        }

        console.log(`[TERRITORY DEBUG] Fetching municipalities for province ${provinceCode}...`);
        // Nota: La API requiere regionCode o devolverá todos. 
        // Si no tenemos regionCode, podemos filtrar localmente o consultar el endpoint específico si existe.
        const response = await fetch(`https://api.digital.gob.do/v1/territories/municipalities?provinceCode=${provinceCode}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        const data = await response.json();

        if (data.valid && data.data) {
            // Aseguramos que data.data sea un array antes de ordenar
            const municipalities = Array.isArray(data.data) ? data.data : [data.data];
            const sortedMunicipalities = municipalities.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            return res.json(sortedMunicipalities);
        }

        res.status(400).json({ message: 'API Territorial no devolvió datos válidos.' });
    } catch (error) {
        console.error('[TERRITORY ERROR] municipalities:', error);
        res.status(500).json({ message: 'Error al conectar con la API Territorial.' });
    }
});

module.exports = router;
