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


    // Launch Puppeteer (Conditional for Vercel)
    let browser;
    try {
      if (process.env.VERCEL) {
        console.log('[PDF GEN] Launching Puppeteer on Vercel...');
        const chromium = require('@sparticuz/chromium');
        const puppeteerCore = require('puppeteer-core');
        browser = await puppeteerCore.launch({
          args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        });
      } else {
        console.log('[PDF GEN] Launching Puppeteer locally...');
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }
    } catch (launchError) {
      console.error('[PDF GEN] Browser launch failed:', launchError);
      throw new Error(`Browser launch failed: ${launchError.message}`);
    }

    const page = await browser.newPage();

    // Load logo for watermark
    const fs = require('fs');
    const path = require('path');
    let logoBase64 = '';
    try {
      // Direct relative path or absolute path using process.cwd()
      const logoPath = path.join(process.cwd(), 'public/logo_base64.txt');
      console.log(`[PDF GEN] Attempting to load logo from: ${logoPath}`);
      if (fs.existsSync(logoPath)) {
        logoBase64 = fs.readFileSync(logoPath, 'utf8').trim();
      } else {
        const altPath = path.join(__dirname, '../public/logo_base64.txt');
        console.log(`[PDF GEN] Logo not found at main path, trying alt: ${altPath}`);
        if (fs.existsSync(altPath)) {
          logoBase64 = fs.readFileSync(altPath, 'utf8').trim();
        }
      }
    } catch (e) {
      console.error('[PDF GEN] Could not load logo for PDF watermark:', e.message);
    }

    // HTML Template
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Dancing+Script:wght@600&display=swap');
            
            body {
                font-family: 'Inter', sans-serif;
                margin: 0;
                padding: 40px;
                color: #1e293b;
                line-height: 1.5;
                position: relative;
            }

            .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-30deg);
                opacity: 0.07;
                z-index: -1;
                width: 70%;
                pointer-events: none;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 3px solid #3b82f6;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            
            .title-section h1 {
                font-size: 28px;
                color: #1e40af;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .title-section p {
                font-size: 14px;
                color: #475569;
                margin: 5px 0 0 0;
                font-weight: 600;
            }
            
            .logo-section {
                text-align: right;
            }

            .logo-img {
                width: 100px;
                margin-bottom: 5px;
            }
            
            .patient-card {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 25px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .info-group label {
                display: block;
                font-size: 11px;
                color: #64748b;
                text-transform: uppercase;
                font-weight: 700;
                margin-bottom: 4px;
            }
            
            .info-group div {
                font-size: 16px;
                font-weight: 600;
                color: #0f172a;
            }
            
            .section-title {
                font-size: 20px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 20px;
                border-left: 5px solid #3b82f6;
                padding-left: 15px;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 40px;
                font-size: 13px;
                background-color: rgba(255, 255, 255, 0.7);
            }
            
            thead th {
                background-color: #3b82f6;
                text-align: left;
                padding: 14px;
                color: white;
                font-weight: 600;
                border: none;
            }
            
            tbody td {
                padding: 14px;
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
            }
            
            tbody tr:nth-child(even) {
                background-color: rgba(248, 250, 252, 0.8);
            }
            
            .chip {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 9999px;
                font-size: 11px;
                font-weight: 700;
                background-color: #dbeafe;
                color: #1e40af;
                border: 1px solid #bfdbfe;
            }

            .signatures-container {
                display: flex;
                justify-content: space-around;
                margin-top: 60px;
                margin-bottom: 40px;
            }

            .signature-box {
                text-align: center;
                width: 200px;
                position: relative;
            }

            .signature-line {
                border-top: 1px solid #1e293b;
                margin-top: 50px;
                padding-top: 10px;
            }

            .signature-text {
                font-family: 'Dancing Script', cursive;
                font-size: 22px;
                color: #1e3a8a;
                position: absolute;
                top: 15px;
                left: 0;
                right: 0;
            }

            .stamp {
                position: absolute;
                width: 90px;
                height: 90px;
                border: 3px double #1e3a8a;
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 5px;
                color: #1e3a8a;
                font-weight: bold;
                font-size: 8px;
                opacity: 0.6;
                transform: rotate(-15deg);
                top: -40px;
                right: -40px;
                background: transparent;
                pointer-events: none;
            }

            .stamp-inner {
                border: 1px solid #1e3a8a;
                border-radius: 50%;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
            }

            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 11px;
                color: #64748b;
                border-top: 1px solid #e2e8f0;
                padding-top: 25px;
            }

            .security-code {
                margin-top: 10px;
                font-family: monospace;
                font-size: 9px;
                color: #94a3b8;
            }
        </style>
    </head>
    <body>
        ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="watermark" />` : ''}

        <div class="header">
            <div class="title-section">
                <h1>Historial de Vacunación</h1>
                <p>Sistema Nacional de Inmunización de la República Dominicana</p>
            </div>
            <div class="logo-section">
                ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="logo-img" />` : ''}
                <div style="font-size: 12px; color: #1e40af; font-weight: bold;">VACUNAS RD</div>
                <div style="font-size: 11px; color: #64748b;">Fecha de Emisión: ${new Date().toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
        </div>

        <div class="patient-card">
            <div class="info-group">
                <label>Nombre del Paciente</label>
                <div>${medicalHistory.NombrePaciente}</div>
            </div>
            <div class="info-group">
                <label>Fecha de Nacimiento</label>
                <div>${new Date(medicalHistory.FechaNacimiento).toLocaleDateString('es-DO')}</div>
            </div>
        </div>

        <h2 class="section-title">Registro Oficial de Inmunización</h2>

        ${vaccinationHistory.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>Vacuna / Antígeno</th>
                    <th>Dosis</th>
                    <th>Fecha Aplicación</th>
                    <th>No. Lote</th>
                    <th>Centro y Personal Autorizado</th>
                </tr>
            </thead>
            <tbody>
                ${vaccinationHistory.map(vac => `
                <tr>
                    <td>
                        <div style="font-weight: bold; color: #1e293b;">${vac.Vacuna}</div>
                    </td>
                    <td><span class="chip">Dosis ${vac.NumeroDosis} ${vac.DosisLimite ? `de ${vac.DosisLimite}` : ''}</span></td>
                    <td>${new Date(vac.FechaAplicacion).toLocaleDateString('es-DO')}</td>
                    <td><span style="font-family: monospace;">${vac.NumeroLote || '---'}</span></td>
                    <td>
                        <div style="font-weight: 500;">${vac.CentroMedico}</div>
                        <div style="font-size: 10px; color: #64748b; margin-top: 3px;">
                            <span style="font-weight: bold;">Certificado por:</span> ${vac.NombreCompletoPersonal}
                        </div>
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : `
        <div style="padding: 40px; text-align: center; color: #64748b; background-color: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
            <div style="font-size: 18px; margin-bottom: 10px;">No se registran inmunizaciones aplicadas</div>
            <p>Este paciente no presenta antecedentes de vacunación en el sistema nacional.</p>
        </div>
        `}

        <div class="signatures-container">
            <div class="signature-box">
                <div class="signature-text" style="font-size: 24px;">Vacunas RD</div>
                <div class="signature-line">
                    <div style="font-weight: bold; font-size: 11px;">Dirección Nacional de Inmunización</div>
                    <div style="font-size: 9px; color: #64748b;">Sello Digital Autorizado</div>
                </div>
                <div class="stamp">
                    <div class="stamp-inner">
                        <div>REPÚBLICA DOMINICANA</div>
                        <div style="font-size: 10px; margin: 2px 0;">OFICIAL</div>
                        <div>VACUNAS RD</div>
                    </div>
                </div>
            </div>

            <div class="signature-box">
                <div class="signature-text" style="font-size: 18px; top: 22px;">${vaccinationHistory.length > 0 ? vaccinationHistory[0].NombreCompletoPersonal : '---'}</div>
                <div class="signature-line">
                    <div style="font-weight: bold; font-size: 11px;">Firma del Personal de Salud</div>
                    <div style="font-size: 9px; color: #64748b;">Médico / Enfermera Certificada</div>
                </div>
            </div>

            <div class="signature-box">
                <div class="signature-line" style="margin-top: 75px;">
                    <div style="font-weight: bold; font-size: 11px;">Sello del Centro de Vacunación</div>
                    <div style="font-size: 9px; color: #64748b;">${vaccinationHistory.length > 0 ? vaccinationHistory[0].CentroMedico : 'Establecimiento de Salud'}</div>
                </div>
                <div class="stamp" style="right: auto; left: -20px; opacity: 0.4; transform: rotate(10deg);">
                    <div class="stamp-inner" style="border: 2px solid #1e3a8a;">
                        <div>CENTRO AUTORIZADO</div>
                        <div style="font-size: 7px; margin: 2px 0;">CONTROL DE CALIDAD</div>
                        <div>DEPARTAMENTO PAI</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Este documento es un certificado oficial generado por el Sistema Nacional de Vacunación. La información contenida tiene carácter de declaración jurada y es válida para fines escolares, laborales y migratorios.</p>
            <div class="security-code">
                CÓDIGO DE VALIDACIÓN: DNI-${Date.now().toString(36).toUpperCase()} | ID: ${id_Nino} | FECHA: ${new Date().toISOString()}
            </div>
        </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

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
