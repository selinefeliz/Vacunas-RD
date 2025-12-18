const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/appointments - Get appointments based on user role
router.get('/', verifyToken, async (req, res) => {
    try {
        const { id: userId, id_Rol, id_CentroVacunacion } = req.user;
        const pool = await poolPromise;

        if (typeof id_Rol !== 'number') {
            return res.status(401).send({ message: 'Unauthorized: Role ID is invalid or not found in token.' });
        }

        let result;

        // For Personal del Centro de Vacunación (role 6)
        if (id_Rol === 6) {
            if (!id_CentroVacunacion) {
                return res.status(400).send({ message: 'Bad Request: Center ID is required for center staff.' });
            }

            result = await pool.request()
                .input('id_CentroVacunacion', sql.Int, id_CentroVacunacion)
                .execute('usp_GetAppointmentsByCenter');
        } else {
            // For Tutors and regular users (Role 5)
            result = await pool.request()
                .input('id_Usuario', sql.Int, userId)
                .execute('dbo.usp_GetAppointmentsByUser');
        }

        res.json(result.recordset);

    } catch (err) {
        console.error(`[API APPOINTMENTS GET /] SQL error:`, err);
        res.status(500).send({ message: 'Failed to retrieve appointments.', error: err.message });
    }
});

// GET /api/appointments/medicos - Get doctors for the user's assigned center (Role 6 only)
router.get('/medicos', [verifyToken, checkRole([6])], async (req, res) => {
    try {
        const { id_CentroVacunacion } = req.user;
        if (!id_CentroVacunacion) {
            return res.status(400).json({ message: 'No se encontró el centro de vacunación asignado al usuario.' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_CentroVacunacion', sql.Int, id_CentroVacunacion)
            .execute('usp_GetMedicosByCentro');

        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error on GET /api/appointments/medicos:', err);
        res.status(500).json({ message: 'Error al obtener los médicos del centro.', error: err.message });
    }
});

// POST /api/appointments - Create a new appointment
router.post('/', verifyToken, async (req, res) => {
    try {
        const { id: id_Usuario } = req.user;
        const { id_Nino, id_CentroVacunacion, id_Vacuna, Fecha, Hora } = req.body;

        if (!id_CentroVacunacion || !id_Vacuna || !Fecha || !Hora) {
            return res.status(400).json({ message: 'Faltan campos requeridos para la cita.' });
        }

        // Format Hora to HH:MM:SS for SQL Server Time type
        let formattedHora = Hora;
        if (Hora && typeof Hora === 'string' && Hora.match(/^\d{2}:\d{2}$/)) {
            formattedHora = Hora + ':00';
        }

        const pool = await poolPromise;
        const request = pool.request();

        request.input('id_Nino', sql.Int, id_Nino || null);
        request.input('id_Vacuna', sql.Int, id_Vacuna);
        request.input('id_CentroVacunacion', sql.Int, id_CentroVacunacion);
        request.input('Fecha', sql.Date, Fecha);
        request.input('Hora', sql.Time, formattedHora);
        request.input('id_UsuarioRegistraCita', sql.Int, id_Usuario);
        request.input('RequiereTutor', sql.Bit, id_Nino ? 1 : 0);
        request.output('OutputMessage', sql.NVarChar(255));
        request.output('New_id_Cita', sql.Int);

        const result = await request.execute('usp_ScheduleAppointment');

        res.status(201).json({
            message: result.output.OutputMessage || 'Cita agendada exitosamente.',
            id_Cita: result.output.New_id_Cita
        });

    } catch (err) {
        console.error('API Error on POST /api/appointments:', err);
        const errorMessage = err.originalError?.info?.message || err.message;
        res.status(500).json({
            message: 'Error al agendar la cita.',
            error: errorMessage
        });
    }
});

// PUT /api/appointments/:id/edit - Edit appointment details (Personal del Centro only)
router.put('/:id/edit', [verifyToken, checkRole([6])], async (req, res) => {
    try {
        const { id } = req.params;
        const { Fecha, Hora, id_PersonalSalud } = req.body;

        if (!Fecha || !Hora) {
            return res.status(400).json({ message: 'Fecha y Hora son campos requeridos.' });
        }

        // Validate time format HH:MM
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(Hora)) {
            return res.status(400).json({ message: 'Formato de hora inválido. Use HH:MM' });
        }

        let formattedHora = Hora;
        if (Hora && typeof Hora === 'string' && Hora.match(/^\d{1,2}:\d{2}$/)) {
            if (Hora.length === 4) formattedHora = '0' + Hora;
            formattedHora = formattedHora + ':00';
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_Cita', sql.Int, parseInt(id))
            .input('Fecha', sql.Date, Fecha)
            .input('Hora', sql.VarChar(8), formattedHora)
            .input('id_PersonalSalud', sql.Int, id_PersonalSalud || null)
            .execute('usp_EditAppointment');

        res.status(200).json({
            message: 'Cita actualizada exitosamente.',
            data: result.recordset[0]
        });

    } catch (err) {
        console.error('SQL error on PUT /api/appointments/:id/edit:', err);
        const dbErrorMessage = err.originalError?.info?.message || err.message;
        res.status(400).json({ message: dbErrorMessage });
    }
});

// POST /api/appointments/:id/record - Record a vaccination (staff only)
router.post('/:id/record', [verifyToken, checkRole([1, 6])], async (req, res) => {
    try {
        const { id } = req.params;
        const {
            id_PersonalSalud_Usuario,
            id_LoteAplicado,
            NombreCompletoPersonalAplicado,
            DosisAplicada,
            EdadAlMomento,
            NotasAdicionales,
            Alergias
        } = req.body;

        const pool = await poolPromise;
        const request = pool.request()
            .input('id_Cita', sql.Int, id)
            .input('id_PersonalSalud_Usuario', sql.Int, id_PersonalSalud_Usuario)
            .input('id_LoteAplicado', sql.Int, id_LoteAplicado)
            .input('NombreCompletoPersonalAplicado', sql.NVarChar(100), NombreCompletoPersonalAplicado)
            .input('DosisAplicada', sql.NVarChar(50), DosisAplicada)
            .input('EdadAlMomento', sql.NVarChar(20), EdadAlMomento)
            .input('NotasAdicionales', sql.NVarChar(sql.MAX), NotasAdicionales)
            .input('Alergias', sql.NVarChar(sql.MAX), Alergias)
            .output('OutputMessage', sql.NVarChar(255));

        await request.execute('usp_RecordVaccination');

        res.status(200).send({ message: request.parameters.OutputMessage.value });
    } catch (err) {
        console.error('SQL error on POST /api/appointments/:id/record:', err);
        res.status(500).send({ message: 'Failed to record vaccination.', error: err.message });
    }
});

module.exports = router;