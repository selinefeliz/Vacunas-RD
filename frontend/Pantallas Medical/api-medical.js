const express = require("express")
const { sql, poolPromise } = require("../config/db")
const { verifyToken, checkRole } = require("../middleware/authMiddleware")

const router = express.Router()

// =============================================
// GET /api/medical/appointments - Get appointments for medical staff
// =============================================
router.get("/appointments", [verifyToken, checkRole([1, 6])], async (req, res) => {
  try {
    const { id: userId, id_Rol } = req.user
    console.log(`[API MEDICAL GET /appointments] User: ${userId}, Role: ${id_Rol}`)

    const pool = await poolPromise
    const result = await pool.request().input("id_PersonalSalud", sql.Int, userId).execute("usp_GetMedicalAppointments")

    console.log(`[API MEDICAL GET /appointments] Found ${result.recordset.length} appointments`)
    res.json(result.recordset)
  } catch (err) {
    console.error("SQL error on GET /api/medical/appointments:", err)
    res.status(500).json({ message: "Error al obtener las citas médicas.", error: err.message })
  }
})

// =============================================
// GET /api/medical/vaccine-lots/:vaccineId - Get available vaccine lots for a specific vaccine
// =============================================
router.get("/vaccine-lots/:vaccineId", [verifyToken, checkRole([1, 6])], async (req, res) => {
  try {
    const { vaccineId } = req.params
    const { id_CentroVacunacion } = req.user

    console.log(`[API MEDICAL GET /vaccine-lots] Vaccine: ${vaccineId}, Center: ${id_CentroVacunacion}`)

    if (!id_CentroVacunacion) {
      return res.status(400).json({ message: "Centro de vacunación no encontrado." })
    }

    const pool = await poolPromise
    const result = await pool
      .request()
      .input("id_Vacuna", sql.Int, Number.parseInt(vaccineId))
      .input("id_CentroVacunacion", sql.Int, id_CentroVacunacion)
      .execute("usp_GetAvailableVaccineLots")

    console.log(`[API MEDICAL GET /vaccine-lots] Found ${result.recordset.length} lots`)
    res.json(result.recordset)
  } catch (err) {
    console.error("SQL error on GET /api/medical/vaccine-lots:", err)
    res.status(500).json({ message: "Error al obtener los lotes de vacuna.", error: err.message })
  }
})

// =============================================
// POST /api/medical/attend-appointment - Process appointment attendance
// =============================================
router.post("/attend-appointment", [verifyToken, checkRole([1, 6])], async (req, res) => {
  try {
    const { id: userId } = req.user
    const {
      id_Cita,
      id_LoteVacuna,
      dosisNumero,
      notasAdicionales,
      alergias,
      requiereProximaDosis,
      fechaProximaDosis,
      agendarProximaCita,
    } = req.body

    console.log(`[API MEDICAL POST /attend-appointment] Processing appointment ${id_Cita}`)

    // Validate required fields
    if (!id_Cita || !id_LoteVacuna || !dosisNumero) {
      return res.status(400).json({
        message: "Faltan campos requeridos: id_Cita, id_LoteVacuna, dosisNumero",
      })
    }

    const pool = await poolPromise
    const request = pool
      .request()
      .input("id_Cita", sql.Int, id_Cita)
      .input("id_PersonalSalud", sql.Int, userId)
      .input("id_LoteVacuna", sql.Int, id_LoteVacuna)
      .input("DosisNumero", sql.Int, dosisNumero)
      .input("NotasAdicionales", sql.NVarChar(sql.MAX), notasAdicionales || "")
      .input("Alergias", sql.NVarChar(sql.MAX), alergias || "")
      .input("RequiereProximaDosis", sql.Bit, requiereProximaDosis || false)
      .input("FechaProximaDosis", sql.Date, fechaProximaDosis || null)
      .input("AgendarProximaCita", sql.Bit, agendarProximaCita || false)
      .output("OutputMessage", sql.NVarChar(255))
      .output("Success", sql.Bit)
      .output("ProximaCitaId", sql.Int)

    await request.execute("usp_AttendAppointment")

    const outputMessage = request.parameters.OutputMessage.value
    const success = request.parameters.Success.value
    const proximaCitaId = request.parameters.ProximaCitaId.value

    console.log(`[API MEDICAL POST /attend-appointment] Result - Success: ${success}, Message: ${outputMessage}`)

    if (success) {
      const response = {
        message: outputMessage,
        proximaCitaId: proximaCitaId,
      }
      res.status(200).json(response)
    } else {
      res.status(400).json({ message: outputMessage })
    }
  } catch (err) {
    console.error("SQL error on POST /api/medical/attend-appointment:", err)

    const errorMessage = err.originalError ? err.originalError.message : err.message
    res.status(500).json({
      message: "Error al procesar la atención de la cita.",
      error: errorMessage,
    })
  }
})

// =============================================
// POST /api/medical/create-patient-history - Create patient medical history
// =============================================
router.post("/create-patient-history", [verifyToken, checkRole([1, 6])], async (req, res) => {
  try {
    const { id_Usuario, id_Nino, fechaNacimiento, notasAdicionales, alergias } = req.body

    console.log(`[API MEDICAL POST /create-patient-history] Creating history for user: ${id_Usuario}`)

    // Validate required fields
    if (!id_Usuario || !fechaNacimiento) {
      return res.status(400).json({
        message: "Faltan campos requeridos: id_Usuario, fechaNacimiento",
      })
    }

    const pool = await poolPromise
    const request = pool
      .request()
      .input("id_Usuario", sql.Int, id_Usuario)
      .input("id_Nino", sql.Int, id_Nino || null)
      .input("FechaNacimiento", sql.Date, fechaNacimiento)
      .input("NotasAdicionales", sql.NVarChar(sql.MAX), notasAdicionales || "")
      .input("Alergias", sql.NVarChar(sql.MAX), alergias || "")
      .output("OutputMessage", sql.NVarChar(255))
      .output("Success", sql.Bit)

    await request.execute("usp_CreatePatientHistory")

    const outputMessage = request.parameters.OutputMessage.value
    const success = request.parameters.Success.value

    console.log(`[API MEDICAL POST /create-patient-history] Result - Success: ${success}, Message: ${outputMessage}`)

    if (success) {
      res.status(200).json({ message: outputMessage })
    } else {
      res.status(400).json({ message: outputMessage })
    }
  } catch (err) {
    console.error("SQL error on POST /api/medical/create-patient-history:", err)

    const errorMessage = err.originalError ? err.originalError.message : err.message
    res.status(500).json({
      message: "Error al crear el historial médico.",
      error: errorMessage,
    })
  }
})

// =============================================
// POST /api/medical/patient-full-history - Get complete patient history
// =============================================
router.post("/patient-full-history", [verifyToken, checkRole([1, 6])], async (req, res) => {
  try {
    const { id_Usuario, id_Nino } = req.body
    console.log(`[API MEDICAL POST /patient-full-history] User: ${id_Usuario}, Child: ${id_Nino}`)

    const pool = await poolPromise
    const result = await pool
      .request()
      .input("id_Usuario", sql.Int, id_Usuario)
      .input("id_Nino", sql.Int, id_Nino || null)
      .execute("usp_GetPatientFullHistory")

    console.log(`[API MEDICAL POST /patient-full-history] Found ${result.recordsets.length} recordsets`)
    res.json(result.recordsets)
  } catch (err) {
    console.error("SQL error on POST /api/medical/patient-full-history:", err)
    res.status(500).json({ message: "Error al obtener el historial completo del paciente.", error: err.message })
  }
})

// =============================================
// GET /api/medical/patient-history/:patientId - Get patient vaccination history
// =============================================
router.get("/patient-history/:patientId", [verifyToken, checkRole([1, 6])], async (req, res) => {
  try {
    const { patientId } = req.params
    console.log(`[API MEDICAL GET /patient-history] Patient: ${patientId}`)

    const pool = await poolPromise
    const result = await pool
      .request()
      .input("id_Usuario", sql.Int, Number.parseInt(patientId))
      .execute("usp_GetPatientVaccinationHistory")

    console.log(`[API MEDICAL GET /patient-history] Found ${result.recordset.length} records`)
    res.json(result.recordset)
  } catch (err) {
    console.error("SQL error on GET /api/medical/patient-history:", err)
    res.status(500).json({ message: "Error al obtener el historial del paciente.", error: err.message })
  }
})

// =============================================
// GET /api/medical/appointments/stats - Get appointment statistics for medical dashboard
// =============================================
router.get("/appointments/stats", [verifyToken, checkRole([1, 6])], async (req, res) => {
  try {
    const { id: userId } = req.user
    console.log(`[API MEDICAL GET /appointments/stats] User: ${userId}`)

    const pool = await poolPromise

    // Get today's appointments
    const todayResult = await pool
      .request()
      .input("id_PersonalSalud", sql.Int, userId)
      .input("Fecha", sql.Date, new Date())
      .query(`
                SELECT COUNT(*) as TodayCount
                FROM CitaVacunacion cv
                WHERE cv.id_PersonalSalud = @id_PersonalSalud
                AND CAST(cv.Fecha AS DATE) = CAST(@Fecha AS DATE)
                AND cv.id_EstadoCita = 2
            `)

    // Get this week's appointments
    const weekResult = await pool
      .request()
      .input("id_PersonalSalud", sql.Int, userId)
      .query(`
                SELECT COUNT(*) as WeekCount
                FROM CitaVacunacion cv
                WHERE cv.id_PersonalSalud = @id_PersonalSalud
                AND cv.Fecha >= DATEADD(week, DATEDIFF(week, 0, GETDATE()), 0)
                AND cv.Fecha < DATEADD(week, DATEDIFF(week, 0, GETDATE()) + 1, 0)
                AND cv.id_EstadoCita = 2
            `)

    // Get total attended appointments
    const attendedResult = await pool
      .request()
      .input("id_PersonalSalud", sql.Int, userId)
      .query(`
                SELECT COUNT(*) as AttendedCount
                FROM CitaVacunacion cv
                WHERE cv.id_PersonalSalud = @id_PersonalSalud
                AND cv.id_EstadoCita = 3
            `)

    const stats = {
      todayAppointments: todayResult.recordset[0].TodayCount,
      weekAppointments: weekResult.recordset[0].WeekCount,
      totalAttended: attendedResult.recordset[0].AttendedCount,
    }

    console.log(`[API MEDICAL GET /appointments/stats] Stats:`, stats)
    res.json(stats)
  } catch (err) {
    console.error("SQL error on GET /api/medical/appointments/stats:", err)
    res.status(500).json({ message: "Error al obtener las estadísticas.", error: err.message })
  }
})

// =============================================
// PUT /api/medical/appointments/:id/reschedule - Reschedule an appointment
// =============================================
router.put("/appointments/:id/reschedule", [verifyToken, checkRole([1, 6])], async (req, res) => {
  try {
    const { id } = req.params
    const { fecha, hora, motivo } = req.body
    const { id: userId } = req.user

    console.log(`[API MEDICAL PUT /appointments/${id}/reschedule] User: ${userId}`)

    if (!fecha || !hora) {
      return res.status(400).json({ message: "Fecha y hora son requeridas." })
    }

    const pool = await poolPromise

    // Verify the appointment belongs to this medical staff
    const verifyResult = await pool
      .request()
      .input("id_Cita", sql.Int, Number.parseInt(id))
      .input("id_PersonalSalud", sql.Int, userId)
      .query(`
                SELECT id_Cita FROM CitaVacunacion 
                WHERE id_Cita = @id_Cita AND id_PersonalSalud = @id_PersonalSalud
            `)

    if (verifyResult.recordset.length === 0) {
      return res.status(403).json({ message: "No tiene permisos para modificar esta cita." })
    }

    // Update the appointment
    await pool
      .request()
      .input("id_Cita", sql.Int, Number.parseInt(id))
      .input("Fecha", sql.Date, fecha)
      .input("Hora", sql.Time, hora)
      .query(`
                UPDATE CitaVacunacion 
                SET Fecha = @Fecha, Hora = @Hora
                WHERE id_Cita = @id_Cita
            `)

    // Log the reschedule action
    if (motivo) {
      await pool
        .request()
        .input("id_Cita", sql.Int, Number.parseInt(id))
        .input("Motivo", sql.NVarChar(500), motivo)
        .input("id_PersonalSalud", sql.Int, userId)
        .query(`
                    INSERT INTO LogCitas (id_Cita, Accion, Motivo, id_Usuario, Fecha)
                    VALUES (@id_Cita, 'Reprogramada', @Motivo, @id_PersonalSalud, GETDATE())
                `)
    }

    console.log(`[API MEDICAL PUT /appointments/${id}/reschedule] Appointment rescheduled successfully`)
    res.json({ message: "Cita reprogramada exitosamente." })
  } catch (err) {
    console.error("SQL error on PUT /api/medical/appointments/reschedule:", err)
    res.status(500).json({ message: "Error al reprogramar la cita.", error: err.message })
  }
})

// =============================================
// POST /api/medical/appointments/:id/cancel - Cancel an appointment
// =============================================
router.post("/appointments/:id/cancel", [verifyToken, checkRole([1, 6])], async (req, res) => {
  try {
    const { id } = req.params
    const { motivo } = req.body
    const { id: userId } = req.user

    console.log(`[API MEDICAL POST /appointments/${id}/cancel] User: ${userId}`)

    const pool = await poolPromise

    // Verify the appointment belongs to this medical staff
    const verifyResult = await pool
      .request()
      .input("id_Cita", sql.Int, Number.parseInt(id))
      .input("id_PersonalSalud", sql.Int, userId)
      .query(`
                SELECT id_Cita FROM CitaVacunacion 
                WHERE id_Cita = @id_Cita AND id_PersonalSalud = @id_PersonalSalud
                AND id_EstadoCita IN (1, 2) -- Only allow canceling scheduled or confirmed appointments
            `)

    if (verifyResult.recordset.length === 0) {
      return res.status(403).json({
        message: "No tiene permisos para cancelar esta cita o la cita ya fue procesada.",
      })
    }

    // Update appointment status to cancelled (assuming status 4 = Cancelada)
    await pool
      .request()
      .input("id_Cita", sql.Int, Number.parseInt(id))
      .query(`
                UPDATE CitaVacunacion 
                SET id_EstadoCita = 4
                WHERE id_Cita = @id_Cita
            `)

    // Log the cancellation
    await pool
      .request()
      .input("id_Cita", sql.Int, Number.parseInt(id))
      .input("Motivo", sql.NVarChar(500), motivo || "Cancelada por personal médico")
      .input("id_PersonalSalud", sql.Int, userId)
      .query(`
                INSERT INTO LogCitas (id_Cita, Accion, Motivo, id_Usuario, Fecha)
                VALUES (@id_Cita, 'Cancelada', @Motivo, @id_PersonalSalud, GETDATE())
            `)

    console.log(`[API MEDICAL POST /appointments/${id}/cancel] Appointment cancelled successfully`)
    res.json({ message: "Cita cancelada exitosamente." })
  } catch (err) {
    console.error("SQL error on POST /api/medical/appointments/cancel:", err)
    res.status(500).json({ message: "Error al cancelar la cita.", error: err.message })
  }
})

// =============================================
// GET /api/medical/vaccines - Get available vaccines for medical staff
// =============================================
router.get("/vaccines", [verifyToken, checkRole([1, 6])], async (req, res) => {
  try {
    console.log(`[API MEDICAL GET /vaccines] Getting available vaccines`)

    const pool = await poolPromise
    const result = await pool.request().query(`
                SELECT 
                    v.id_Vacuna,
                    v.Nombre,
                    v.DosisLimite,
                    v.Tipo,
                    v.Descripcion,
                    f.Fabricante as NombreFabricante
                FROM Vacuna v
                INNER JOIN Fabricante f ON v.id_Fabricante = f.id_Fabricante
                ORDER BY v.Nombre
            `)

    console.log(`[API MEDICAL GET /vaccines] Found ${result.recordset.length} vaccines`)
    res.json(result.recordset)
  } catch (err) {
    console.error("SQL error on GET /api/medical/vaccines:", err)
    res.status(500).json({ message: "Error al obtener las vacunas.", error: err.message })
  }
})

module.exports = router
