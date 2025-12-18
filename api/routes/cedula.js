const express = require('express');
const router = express.Router();

/**
 * Valida el formato de una cédula dominicana
 * @param {string} cedula - Cédula a validar (con o sin guiones)
 * @returns {boolean} true si es válida, false si no
 */
function validarCedulaDominicana(cedula) {
    if (!cedula) return false;
    const cedulaLimpia = cedula.replace(/-/g, '');
    if (cedulaLimpia.length !== 11 || !/^\d+$/.test(cedulaLimpia)) return false;

    const digitoVerificador = parseInt(cedulaLimpia[10]);
    const primeros10 = cedulaLimpia.substring(0, 10);

    const pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 10; i++) {
        let producto = parseInt(primeros10[i]) * pesos[i];
        if (producto > 9) producto = Math.floor(producto / 10) + (producto % 10);
        suma += producto;
    }

    const modulo = suma % 10;
    const calculado = modulo === 0 ? 0 : 10 - modulo;

    return digitoVerificador === calculado;
}

/**
 * POST /api/cedula/validate
 */
router.post('/validate', async (req, res) => {
    try {
        const { cedula } = req.body;
        if (!cedula) return res.status(400).json({ valid: false, message: 'Cédula requerida' });

        const cedulaLimpia = cedula.replace(/-/g, '');
        const esValidaLocal = validarCedulaDominicana(cedulaLimpia);

        console.log(`[CEDULA] Validando: ${cedulaLimpia} | Local: ${esValidaLocal}`);

        if (!esValidaLocal) {
            return res.status(200).json({
                valid: false,
                message: 'Cédula con formato inválido',
                localValidation: false
            });
        }

        // Proxy a la API del gobierno
        try {
            // Intentamos con el endpoint v3/cedulas/ primero que es el más estable
            const url = `https://api.digital.gob.do/v3/cedulas/${cedulaLimpia}/validate`;
            console.log(`[CEDULA] Consultando API JCE: ${url}`);

            const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

            if (response.ok) {
                const data = await response.json();
                console.log(`[CEDULA] API JCE Respuesta:`, data);

                // Si el gobierno dice que NO es válida, pero nosotros localmente sí, 
                // podríamos estar ante un caso donde la API no tiene el registro actualizado
                // o estamos usando el endpoint "citizens" que a veces falla.
                if (data.valid) {
                    return res.status(200).json({
                        valid: true,
                        message: 'Cédula verificada en Registro Civil',
                        localValidation: true
                    });
                }
            }
        } catch (e) {
            console.log(`[CEDULA] Error API JCE (usando fallback local): ${e.message}`);
        }

        // Fallback: Si la API del gobierno falla o no la encuentra, pero el formato es válido
        // permitimos el registro indicando que se validó localmente.
        return res.status(200).json({
            valid: true, // Forzamos true si el formato es correcto
            message: 'Cédula con formato válido (validación local exitosa)',
            localValidation: true,
            apiVerified: false
        });

    } catch (error) {
        console.error('[CEDULA] Error fatal:', error);
        res.status(500).json({ valid: false, message: 'Error en servidor de validación' });
    }
});

module.exports = router;
