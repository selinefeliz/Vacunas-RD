const express = require("express")
const router = express.Router()
const { sql, poolPromise } = require("../config/db")
const { verifyToken, checkRole } = require("../middleware/authMiddleware")

// GET /api/medical/appointments - Obtener citas médicas para el usuario autenticado (médico o personal del centro)
router.get("/appointments", [verifyToken, checkRole([2, 5, 6])], async (req, res) => {
  // Added role 5 for nurse
  try {
    const pool = await poolPromise
    const { id, id_Rol } = req.user // Use 'id' from token
    const id_CentroVacunacion_Token = req.user.id_CentroVacunacion // For manager/nurse role
    let result

    if (id_Rol === 2 || id_Rol === 5) {
      // Medico or Enfermero
      // Médico/Enfermero: obtener citas por centro desde query param
      const { id_centro } = req.query
      if (!id_centro) {
        return res.status(400).json({ error: "El parámetro id_centro es requerido para personal médico." })
      }
      console.log(`[MEDICAL APPOINTMENTS] Fetching CONFIRMED appointments for user id=${id} in center id=${id_centro}`)
      result = await pool
        .request()
        .input("id_PersonalSalud", sql.Int, id)
        .input("id_CentroVacunacion", sql.Int, id_centro)
        .execute("dbo.usp_GetMedicalAppointments")
    } else if (id_Rol === 6) {
      // Gestor: obtener todas las citas confirmadas del centro desde el token
      console.log(
        `[MEDICAL APPOINTMENTS] Fetching ALL confirmed appointments for manager in center id=${id_CentroVacunacion_Token}`,
      )
      result = await pool
        .request()
        .input("id_CentroVacunacion", sql.Int, id_CentroVacunacion_Token)
        .execute("dbo.usp_GetConfirmedAppointmentsByCenter")
    } else {
      return res.status(403).json({ error: "Acceso no autorizado para este rol." })
    }

    res.json(result.recordset)
  } catch (error) {
    console.error("Error fetching medical appointments:", error)
    res.status(500).json({
      error: "Error al obtener las citas médicas",
      details: error.message,
    })
  }
})

// POST /api/medical/patient-full-history - Obtener historial completo del paciente
router.post("/patient-full-history", async (req, res) => {
  console.log("=== POST /api/medical/patient-full-history ===")
  console.log("Request body:", req.body)

  try {
    const { id_Usuario, id_Nino } = req.body

    if (!id_Usuario) {
      return res.status(400).json({ error: "id_Usuario es requerido" })
    }

    const pool = await poolPromise

    const result = await pool
      .request()
      .input("id_Usuario", sql.Int, id_Usuario)
      .input("id_Nino", sql.Int, id_Nino || null)
      .execute("dbo.usp_GetPatientFullHistory")

    console.log("Patient history retrieved successfully")

    // Structure the response to be more explicit for the frontend
    const response = {
      medicalHistory: result.recordsets[0] ? result.recordsets[0][0] : null,
      vaccinationHistory: result.recordsets[1] || [],
    }

    res.json(response)
  } catch (error) {
    console.error("Error fetching patient history:", error)
    res.status(500).json({
      error: "Error al obtener el historial del paciente",
      details: error.message,
    })
  }
})

// POST /api/medical/create-patient-history - Crear historial médico
router.post("/create-patient-history", async (req, res) => {
  console.log("=== POST /api/medical/create-patient-history ===")
  console.log("Request body:", req.body)

  try {
    const { id_Usuario, id_Nino, FechaNacimiento, Alergias, NotasAdicionales } = req.body

    if (!id_Usuario || !FechaNacimiento) {
      return res.status(400).json({ error: "id_Usuario y fechaNacimiento son requeridos" })
    }

    const pool = await poolPromise

    const result = await pool
      .request()
      .input("id_Usuario", sql.Int, id_Usuario)
      .input("id_Nino", sql.Int, id_Nino || null)
      .input("FechaNacimiento", sql.Date, FechaNacimiento)
      .input("Alergias", sql.NVarChar(sql.MAX), Alergias || "")
      .input("NotasAdicionales", sql.NVarChar(sql.MAX), NotasAdicionales || "")
      .output("OutputMessage", sql.NVarChar(sql.MAX))
      .output("Success", sql.Bit)
      .execute("dbo.usp_CreatePatientHistory")

    console.log("Patient history created successfully")
    res.json({
      success: true,
      message: "Historial médico creado exitosamente",
      id_Historico: result.recordset?.[0]?.id_Historico || null,
      outputMessage: result.output?.OutputMessage,
      successFlag: result.output?.Success,
    })
  } catch (error) {
    console.error("Error creating patient history:", error)
    res.status(500).json({
      error: "Error al crear el historial médico",
      details: error.message,
    })
  }
})

// GET /api/medical/vaccine-lots/:id_Vacuna - Obtener lotes de vacuna disponibles
router.get("/vaccine-lots/:id_Vacuna", verifyToken, async (req, res) => {
  console.log("=== GET /api/medical/vaccine-lots/:id_Vacuna ===")
  console.log("Vaccine ID:", req.params.id_Vacuna)
  console.log("User center:", req.user?.id_CentroVacunacion)

  try {
    const { id_Vacuna } = req.params
    const { id_centro } = req.query

    if (!id_centro) {
      return res.status(400).json({ error: "El parámetro id_centro es requerido" })
    }

    const pool = await poolPromise

    const result = await pool
      .request()
      .input("id_Vacuna", sql.Int, id_Vacuna)
      .input("id_CentroVacunacion", sql.Int, id_centro)
      .query(`
        SELECT 
          l.id_LoteVacuna,
          l.NumeroLote,
          v.Nombre AS NombreVacuna,
          f.Fabricante AS NombreFabricante,
          l.FechaCaducidad,
          l.CantidadDisponible
        FROM Lote l
        INNER JOIN Vacuna v ON l.id_VacunaCatalogo = v.id_Vacuna
        INNER JOIN Fabricante f ON v.id_Fabricante = f.id_Fabricante
        WHERE l.id_VacunaCatalogo = @id_Vacuna 
        AND l.id_CentroVacunacion = @id_CentroVacunacion
        AND l.CantidadDisponible > 0
        AND l.FechaCaducidad > GETDATE()
        ORDER BY l.FechaCaducidad ASC
      `)

    console.log(`Found ${result.recordset.length} available vaccine lots`)
    res.json(result.recordset)
  } catch (error) {
    console.error("Error fetching vaccine lots:", error)
    res.status(500).json({
      error: "Error al obtener los lotes de vacuna",
      details: error.message,
    })
  }
})

// POST /api/medical/attend-appointment - Procesar atención de cita médica
router.post("/attend-appointment", verifyToken, async (req, res) => {
  console.log("=== POST /api/medical/attend-appointment ===")
  console.log("Request body:", req.body)
  console.log("Medical user:", req.user?.id || req.user?.id_Usuario)

  try {
    const { id_Cita, id_LoteVacuna, dosisNumero, notasAdicionales, alergias } = req.body

    const medicalUserId = req.user?.id ?? req.user?.id_Usuario

    if (!id_Cita || !id_LoteVacuna || !dosisNumero || !medicalUserId) {
      return res.status(400).json({
        error: "Faltan campos requeridos: id_Cita, id_LoteVacuna, dosisNumero son obligatorios",
      })
    }

    const pool = await poolPromise

    // CORRECCIÓN: Obtener el nombre completo del usuario médico con el alias correcto
    const userResult = await pool
      .request()
      .input("id_Usuario", sql.Int, medicalUserId)
      .query(`
        SELECT 
          CONCAT(Nombre, ' ', Apellido) AS NombreCompletoPersonal
        FROM dbo.Usuario 
        WHERE id_Usuario = @id_Usuario
      `)

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: "No se encontró el usuario del personal médico." })
    }

    // CORRECCIÓN: Usar el nombre correcto del campo
    const nombreCompletoPersonal = userResult.recordset[0].NombreCompletoPersonal

    console.log("Nombre completo del personal:", nombreCompletoPersonal)

    const result = await pool
      .request()
      .input("id_Cita", sql.Int, id_Cita)
      .input("id_PersonalSalud_Usuario", sql.Int, medicalUserId)
      .input("id_LoteAplicado", sql.Int, id_LoteVacuna)
      .input("NombreCompletoPersonalAplicado", sql.NVarChar(100), nombreCompletoPersonal)
      .input("DosisAplicada", sql.NVarChar(50), `Dosis ${dosisNumero}`)
      .input("EdadAlMomento", sql.NVarChar(20), "") // This should be calculated, leaving empty for now
      .input("NotasAdicionales", sql.NVarChar(sql.MAX), notasAdicionales || "")
      .input("Alergias", sql.NVarChar(sql.MAX), alergias || "")
      .output("OutputMessage", sql.NVarChar(255))
      .execute("dbo.usp_RecordVaccination")

    const outputMessage = result.output?.OutputMessage || "Cita médica atendida exitosamente"
    console.log("Medical appointment attended successfully:", outputMessage)

    res.json({
      success: true,
      message: outputMessage,
    })
  } catch (error) {
    console.error("Error attending medical appointment:", error)
    res.status(500).json({
      error: "Error al procesar la atención médica",
      details: error.message,
    })
  }
})

module.exports = router
