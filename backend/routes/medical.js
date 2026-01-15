const express = require("express")
const router = express.Router()
const { sql, poolPromise } = require("../config/db")
const { verifyToken, checkRole } = require("../middleware/authMiddleware")

// GET /api/medical/appointments - Obtener citas médicas para el usuario autenticado (médico o personal del centro)
router.get("/appointments", [verifyToken, checkRole([2, 3, 5, 6])], async (req, res) => {
  // Added role 5 for nurse
  try {
    const pool = await poolPromise
    const { id, id_Rol } = req.user // Use 'id' from token
    const id_CentroVacunacion_Token = req.user.id_CentroVacunacion // For manager/nurse role
    let result

    if (id_Rol === 2 || id_Rol === 3 || id_Rol === 5) {
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

    if (!id_Usuario && !id_Nino) {
      return res.status(400).json({ error: "id_Usuario o id_Nino es requerido" })
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

    // We relaxed the requirement for id_Usuario (Tutor ID) in the SP, so we don't enforce it here strictly if id_Nino is present
    if (!id_Nino || !FechaNacimiento) {
      return res.status(400).json({ error: "id_Nino y FechaNacimiento son requeridos" })
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

    // --- NEXT DOSE SCHEDULING LOGIC ---
    if (req.body.agendarProximaCita && req.body.fechaProximaDosis && req.body.horaProximaDosis) {
      try {
        console.log("Attempting to schedule next dose appointment...");
        const { fechaProximaDosis, horaProximaDosis } = req.body;

        // 1. Get details from the CURRENT appointment to replicate (Child, Vaccine, Center)
        const currentApptResult = await pool.request()
          .input("id_Cita", sql.Int, id_Cita)
          .query(`
            SELECT id_Nino, id_Vacuna, id_CentroVacunacion 
            FROM CitaVacunacion 
            WHERE id_Cita = @id_Cita
          `);

        if (currentApptResult.recordset.length > 0) {
          const { id_Nino, id_Vacuna, id_CentroVacunacion } = currentApptResult.recordset[0];

          // Format Time HH:MM
          let formattedHora = horaProximaDosis;
          if (horaProximaDosis.length === 5) { // HH:MM
            formattedHora = horaProximaDosis + ':00';
          }

          // 2. Schedule the new appointment
          const scheduleResult = await pool.request()
            .input('id_Nino', sql.Int, id_Nino)
            .input('id_Vacuna', sql.Int, id_Vacuna)
            .input('id_CentroVacunacion', sql.Int, id_CentroVacunacion)
            .input('Fecha', sql.Date, fechaProximaDosis)
            .input('Hora', sql.VarChar(8), formattedHora)
            .input('id_UsuarioRegistraCita', sql.Int, medicalUserId)
            .input('RequiereTutor', sql.Bit, 1) // Assuming child always requires tutor for now
            .output('OutputMessage', sql.NVarChar(255))
            .output('New_id_Cita', sql.Int)
            .execute('usp_ScheduleAppointment');

          console.log("Next dose scheduled successfully. New ID:", scheduleResult.output.New_id_Cita);
        } else {
          console.warn("Could not find current appointment details to schedule next dose.");
        }
      } catch (scheduleError) {
        console.error("Error scheduling next dose:", scheduleError);
        // We do NOT fail the main request, just log the error, maybe append to message?
      }
    }
    // ----------------------------------

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

// POST /api/medical/change-status - Cambiar estado de cita (ej: No Suministrada)
router.post("/change-status", verifyToken, async (req, res) => {
  console.log("=== POST /api/medical/change-status ===")
  console.log("Request body:", req.body)

  try {
    const { id_Cita, nuevoEstado, notas } = req.body
    const id_UsuarioModifica = req.user?.id ?? req.user?.id_Usuario

    if (!id_Cita || !nuevoEstado) {
      return res.status(400).json({ error: "id_Cita y nuevoEstado son requeridos" })
    }

    const pool = await poolPromise

    // 1. Get ID for the status name (e.g., 'No Suministrada')
    const statusResult = await pool.request()
      .input('Estado', sql.NVarChar(50), nuevoEstado)
      .query("SELECT id_Estado FROM EstadoCita WHERE Estado = @Estado")

    if (statusResult.recordset.length === 0) {
      return res.status(400).json({ error: `El estado '${nuevoEstado}' no es válido.` })
    }

    const id_NuevoEstado = statusResult.recordset[0].id_Estado

    // 2. Update status
    const result = await pool.request()
      .input("id_Cita", sql.Int, id_Cita)
      .input("id_NuevoEstadoCita", sql.Int, id_NuevoEstado)
      .input("id_UsuarioModifica", sql.Int, id_UsuarioModifica)
      .input("Notas", sql.NVarChar(sql.MAX), notas || "")
      .output("OutputMessage", sql.NVarChar(255))
      .execute("dbo.usp_UpdateAppointmentStatus")

    console.log("Status updated successfully:", result.output.OutputMessage)

    res.json({
      success: true,
      message: result.output.OutputMessage,
    })
  } catch (error) {
    console.error("Error updating appointment status:", error)
    res.status(500).json({
      error: "Error al actualizar el estado de la cita",
      details: error.message,
    })
  }
})


// POST /api/medical/patient-history-pdf - Generar PDF del historial de vacunación
router.post("/patient-history-pdf", [verifyToken, checkRole([1, 2, 3, 5, 6])], async (req, res) => {
  // console.log("=== POST /api/medical/patient-history-pdf ===")
  // console.log("Request body:", req.body)

  try {
    const { id_Usuario, id_Nino } = req.body

    if (!id_Usuario && !id_Nino) {
      return res.status(400).json({ error: "id_Usuario o id_Nino es requerido" })
    }

    const pool = await poolPromise

    const result = await pool
      .request()
      .input("id_Usuario", sql.Int, id_Usuario)
      .input("id_Nino", sql.Int, id_Nino || null)
      .execute("dbo.usp_GetPatientFullHistory")

    const medicalHistory = result.recordsets[0] ? result.recordsets[0][0] : null
    const vaccinationHistory = result.recordsets[1] || []

    // console.log("🔍 [PDF GEN] Medical History Data:", medicalHistory);
    // console.log("🔍 [PDF GEN] Vaccination History Sample:", vaccinationHistory[0]);

    if (!medicalHistory) {
      return res.status(404).json({ error: "No se encontró historial médico para este paciente." })
    }

    // Extra info fetch removed as per user request to simplify and remove ID/Age fields


    // Launch Puppeteer
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // HTML Template
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            
            body {
                font-family: 'Inter', sans-serif;
                margin: 0;
                padding: 40px;
                color: #1e293b;
                line-height: 1.5;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #0f172a;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            
            .title-section h1 {
                font-size: 24px;
                color: #0f172a;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .title-section p {
                font-size: 12px;
                color: #64748b;
                margin: 5px 0 0 0;
            }
            
            .logo-section {
                text-align: right;
            }
            
            .patient-card {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .info-group label {
                display: block;
                font-size: 11px;
                color: #64748b;
                text-transform: uppercase;
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .info-group div {
                font-size: 16px;
                font-weight: 600;
                color: #334155;
            }
            
            .section-title {
                font-size: 18px;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 15px;
                border-left: 4px solid #3b82f6;
                padding-left: 10px;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                font-size: 13px;
            }
            
            thead th {
                background-color: #f1f5f9;
                text-align: left;
                padding: 12px;
                color: #475569;
                font-weight: 600;
                border-bottom: 2px solid #e2e8f0;
            }
            
            tbody td {
                padding: 12px;
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
            }
            
            tbody tr:nth-child(even) {
                background-color: #fafbfc;
            }
            
            .chip {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 9999px;
                font-size: 11px;
                font-weight: 600;
                background-color: #dbeafe;
                color: #1e40af;
            }

            .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 10px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title-section">
                <h1>Historial de Vacunación</h1>
                <p>Reporte Oficial del Sistema Nacional de Vacunación</p>
            </div>
            <div class="logo-section">
                <!-- Placeholder for Logo or additional info -->
                <div style="font-weight: bold; font-size: 20px; color: #3b82f6;">VAC-RD</div>
                <div style="font-size: 10px; color: #64748b;">${new Date().toLocaleDateString()}</div>
            </div>
        </div>

        <div class="patient-card">
            <div class="info-group">
                <label>Paciente</label>
                <div>${medicalHistory.NombrePaciente}</div>
            </div>
            <div class="info-group">
                <label>Fecha de Nacimiento</label>
                <div>${new Date(medicalHistory.FechaNacimiento).toLocaleDateString()}</div>
            </div>

        </div>

        <h2 class="section-title">Registro de Dosis Aplicadas</h2>

        ${vaccinationHistory.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>Vacuna</th>
                    <th>Dosis</th>
                    <th>Fecha Aplicación</th>
                    <th>Lote</th>
                    <th>Centro / Personal</th>
                </tr>
            </thead>
            <tbody>
                ${vaccinationHistory.map(vac => `
                <tr>
                    <td>
                        <div style="font-weight: bold;">${vac.Vacuna}</div>
                    </td>
                    <td><span class="chip">${vac.NumeroDosis} ${vac.DosisLimite ? `de ${vac.DosisLimite}` : ''}</span></td>
                    <td>${new Date(vac.FechaAplicacion).toLocaleDateString()}</td>
                    <td>${vac.NumeroLote || 'N/A'}</td>
                    <td>
                        <div>${vac.CentroMedico}</div>
                        <div style="font-size: 10px; color: #64748b;">Aplicado por: ${vac.NombreCompletoPersonal}</div>
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : `
        <div style="padding: 20px; text-align: center; color: #64748b; background-color: #f8fafc; border-radius: 8px;">
            Este paciente no tiene registros de vacunación aún.
        </div>
        `}

        <div class="footer">
            <p>Este documento es un reporte generado electrónicamente. No requiere firma ni sello húmedo.</p>
            <p>Generado por: ${req.user.role === 1 ? 'Administrador' : 'Personal Médico'} | ID de Referencia: ${Date.now()}</p>
        </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });

    await browser.close();

    // Send PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Historial_Vacunacion_${id_Nino}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generating PDF:", error)
    res.status(500).json({
      error: "Error al generar el PDF del historial",
      details: error.message,
    })
  }
})

module.exports = router
