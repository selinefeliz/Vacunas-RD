import { useState, useEffect } from "react"
import useApi from "@/hooks/use-api"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Calendar, Syringe, MapPin, Clock, Pencil, Plus, Download } from "lucide-react"
import { formatDateString, formatTimeString } from "@/utils/format-time"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"

interface PatientHistory {
  id_Historico: number
  FechaNacimiento: string
  NotasAdicionales: string
  Alergias: string
  FechaCreacion: string
  NombrePaciente: string
  EdadActual: number
}

interface VaccinationRecord {
  id_Nino?: number
  id_HistoricoCita: number
  Vacuna: string
  NombreCompletoPersonal: string
  NumeroLote?: string
  CentroMedico: string
  FechaAplicacion: string
  HoraAplicacion: string
  Notas: string
  FechaCita: string
  HoraCita: string
  DosisLimite: number
  NumeroDosis: number
}

interface PatientHistoryViewProps {
  patientId: number
  childId?: number
  showVaccinesOnly?: boolean
  hideVaccinationSection?: boolean
}

export function PatientHistoryView({ patientId, childId, showVaccinesOnly = false, hideVaccinationSection = false }: PatientHistoryViewProps) {
  const { toast } = useToast()
  const { request: fetchHistory, loading } = useApi()
  const { request: saveHistory, loading: saving } = useApi()

  const [patientHistory, setPatientHistory] = useState<PatientHistory | null>(null)
  const [vaccinationRecords, setVaccinationRecords] = useState<VaccinationRecord[]>([])

  // Edit State
  const { user, token } = useAuth()

  // PDF Generation State
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Edit State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    Alergias: "",
    NotasAdicionales: "",
    FechaNacimiento: ""
  })

  useEffect(() => {
    loadPatientHistory()
  }, [patientId, childId])

  const loadPatientHistory = async () => {
    try {
      const response = await fetchHistory("/api/medical/patient-full-history", {
        method: "POST",
        body: {
          id_Usuario: patientId,
          id_Nino: childId || null,
        },
      });

      if (response) {
        setPatientHistory(response.medicalHistory);
        setVaccinationRecords(response.vaccinationHistory || []);

        // Initialize form with existing data if available
        if (response.medicalHistory) {
          setEditForm({
            Alergias: response.medicalHistory.Alergias || "",
            NotasAdicionales: response.medicalHistory.NotasAdicionales || "",
            FechaNacimiento: response.medicalHistory.FechaNacimiento ? new Date(response.medicalHistory.FechaNacimiento).toISOString().split('T')[0] : ""
          })
        }
      }
    } catch (error) {
      console.error("Error loading patient history:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el historial del paciente",
      })
    }
  }

  const handleOpenEdit = () => {
    if (patientHistory) {
      setEditForm({
        Alergias: patientHistory.Alergias || "",
        NotasAdicionales: patientHistory.NotasAdicionales || "",
        FechaNacimiento: patientHistory.FechaNacimiento ? new Date(patientHistory.FechaNacimiento).toISOString().split('T')[0] : ""
      })
    }
    setIsDialogOpen(true)
  }

  const handleSaveHistory = async () => {
    try {
      await saveHistory("/api/medical/create-patient-history", {
        method: "POST",
        body: {
          id_Usuario: patientId, // Doctor/Nurse ID (who is editing) - WAIT, backend expects this to be the USER ID? 
          // Let's check backend logic. 
          // usp_CreatePatientHistory params: @id_Usuario (to find Tutor), @id_Nino.
          // Actually Backend endpoint /create-patient-history takes { id_Usuario, id_Nino... }
          // In context of this component, 'patientId' is passed as prop. 
          // BUT `patientId` prop in `PatientHistoryView` usage seems to be the Tutor/User ID responsible for the child?
          // Let's verify usage in medical-appointments-view.tsx. 
          // It passes `patientId={selectedPatient.id_Usuario}`.
          // So yes, we pass the Tutor's User ID.
          id_Nino: childId,
          FechaNacimiento: editForm.FechaNacimiento,
          Alergias: editForm.Alergias,
          NotasAdicionales: editForm.NotasAdicionales
        }
      });

      toast({
        title: "Éxito",
        description: "Historial médico actualizado correctamente",
      })
      setIsDialogOpen(false)
      loadPatientHistory() // Reload to show changes
    } catch (error) {
      console.error("Error saving history:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al guardar el historial",
      })
    }
  }

  const handleDownloadPDF = async () => {
    if (!childId) return;
    const printUrl = `/print/vaccination-history/${childId}`;
    window.open(printUrl, '_blank');
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if ((!patientHistory || !patientHistory.FechaCreacion) && !showVaccinesOnly) {
    return (
      <Card className="border-gray-200">
        <CardContent className="text-center py-8">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-gray-500">No se ha inicializado el historial médico para este paciente.</p>
          <p className="text-xs text-gray-400 mt-2">Puede inicializarlo manualmente o registrar una vacuna.</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={handleOpenEdit}>
            <Plus className="h-4 w-4" />
            Inicializar Historial
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inicializar Historial Médico</DialogTitle>
                <DialogDescription>
                  Ingrese la información inicial para crear el expediente médico.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="dob">Fecha de Nacimiento</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={editForm.FechaNacimiento}
                    disabled
                    readOnly
                    className="bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-muted-foreground">La fecha de nacimiento no se puede modificar.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="allergies">Alergias</Label>
                  <Textarea
                    id="allergies"
                    placeholder="Describa alergias conocidas..."
                    value={editForm.Alergias}
                    onChange={(e) => setEditForm({ ...editForm, Alergias: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notas Médicas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Historial previo, condiciones..."
                    value={editForm.NotasAdicionales}
                    onChange={(e) => setEditForm({ ...editForm, NotasAdicionales: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveHistory} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Historial"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Patient Basic Information */}
      {!showVaccinesOnly && patientHistory && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Paciente
                </CardTitle>
                <CardDescription>Datos básicos del historial médico</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenEdit}>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Nombre:</span>
                  <p className="text-lg">{patientHistory.NombrePaciente}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Fecha de Nacimiento:</span>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(patientHistory.FechaNacimiento).getUTCFullYear()}-
                    {(new Date(patientHistory.FechaNacimiento).getUTCMonth() + 1).toString().padStart(2, '0')}-
                    {new Date(patientHistory.FechaNacimiento).getUTCDate().toString().padStart(2, '0')}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Edad Actual:</span>
                  <p className="text-lg font-semibold text-blue-600">
                    {patientHistory.EdadActual > 0
                      ? `${patientHistory.EdadActual} ${patientHistory.EdadActual === 1 ? 'año' : 'años'}`
                      : (
                        (() => {
                          const birth = new Date(patientHistory.FechaNacimiento);
                          const today = new Date();

                          // Rough month diff
                          let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());

                          // Adjust if day of month hasn't passed yet
                          if (today.getUTCDate() < birth.getUTCDate()) {
                            months--;
                          }

                          if (months <= 0) {
                            // Calculate days
                            const diffTime = Math.abs(today.getTime() - birth.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return `${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
                          }

                          return `${months} ${months === 1 ? 'mes' : 'meses'}`;
                        })()
                      )
                    }
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Alergias:</span>
                  <p className="text-sm bg-red-50 p-2 rounded border text-black font-medium">
                    {patientHistory.Alergias || "No se han registrado alergias"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Notas Médicas:</span>
                  <p className="text-sm bg-blue-50 p-2 rounded border text-black font-medium">
                    {patientHistory.NotasAdicionales || "No hay notas adicionales"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Historial Médico</DialogTitle>
                <DialogDescription>
                  Modifique la información médica del paciente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* DOB is technically editable in backend, but risky to change freely. Allowing it as per backend capability. */}
                <div className="grid gap-2">
                  <Label htmlFor="dob-edit">Fecha de Nacimiento</Label>
                  <Input
                    id="dob-edit"
                    type="date"
                    value={editForm.FechaNacimiento}
                    disabled
                    readOnly
                    className="bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-muted-foreground">La fecha de nacimiento no se puede modificar.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="allergies-edit">Alergias</Label>
                  <Textarea
                    id="allergies-edit"
                    placeholder="Describa alergias conocidas..."
                    value={editForm.Alergias}
                    onChange={(e) => setEditForm({ ...editForm, Alergias: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes-edit">Notas Médicas</Label>
                  <Textarea
                    id="notes-edit"
                    placeholder="Historial previo, condiciones..."
                    value={editForm.NotasAdicionales}
                    onChange={(e) => setEditForm({ ...editForm, NotasAdicionales: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveHistory} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      )}


      {/* Vaccination History (Shown unless hidden) */}
      {!hideVaccinationSection && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5" />
                  Historial de Vacunación
                </CardTitle>
                <CardDescription>
                  Registro completo de vacunas aplicadas ({vaccinationRecords.length} registros)
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
                {isGeneratingPDF ? (
                  <>Generando...</>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Imprimir (PDF)
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {vaccinationRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vacuna</TableHead>
                      <TableHead>Dosis</TableHead>
                      <TableHead>Fecha Aplicación</TableHead>
                      <TableHead>Centro Médico</TableHead>
                      <TableHead>Personal</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vaccinationRecords.map((record, index) => (
                      <TableRow key={`${record.id_HistoricoCita}-${index}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{record.Vacuna}</span>
                            <span className="text-xs text-gray-500">Esquema: {record.DosisLimite} dosis</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {record.NumeroDosis} de {record.DosisLimite}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateString(record.FechaAplicacion)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {formatTimeString(record.HoraAplicacion)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {record.CentroMedico}
                          </div>
                        </TableCell>
                        <TableCell>{record.NombreCompletoPersonal || "N/A"}</TableCell>
                        <TableCell>{record.NumeroLote || "N/A"}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-xs text-gray-600 truncate" title={record.Notas}>
                              {record.Notas || "Sin notas"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Syringe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se han registrado vacunas para este paciente</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
