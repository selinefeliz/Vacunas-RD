"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import useApi from "@/hooks/use-api"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Syringe, Package, FileText, History, XCircle } from "lucide-react"
import { formatDateString, formatTimeString } from "@/utils/format-time"
import { PatientHistoryForm } from "./patient-history-form"
import { PatientHistoryView } from "./patient-history-view"
import type { MedicalAppointment } from "@/types/medical"



interface VaccineLot {
  id_LoteVacuna: number
  NumeroLote: string
  NombreVacuna: string
  NombreFabricante: string
  FechaCaducidad: string
  CantidadDisponible: number
}

const attendSchema = z.object({
  id_LoteVacuna: z.string().min(1, "Debe seleccionar un lote de vacuna"),
  dosisNumero: z.coerce.number().min(1, "El número de dosis debe ser mayor a 0"),
  requiereProximaDosis: z.boolean().default(false),
  fechaProximaDosis: z.string().optional(),
  horaProximaDosis: z.string().optional(),
  agendarProximaCita: z.boolean().default(false),
}).refine((data) => {
  if (data.agendarProximaCita) {
    if (!data.fechaProximaDosis) return false;
    if (!data.horaProximaDosis) return false;
  }
  return true;
}, {
  message: "Fecha y hora son requeridas para agendar cita",
  path: ["fechaProximaDosis"], // This will attach error to fecha, but covers both logically
});

interface AttendAppointmentModalProps {
  appointment: MedicalAppointment
  patientId: number // The ID of the tutor
  centerId?: number // The ID of the selected center
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AttendAppointmentModal({ appointment, patientId, centerId, isOpen, onClose, onSuccess }: AttendAppointmentModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { request: fetchLots, loading: loadingLots } = useApi<VaccineLot[]>()
  const { request: attendAppointment, loading: attending } = useApi()
  const { request: changeStatus, loading: changingStatus } = useApi() // New hook for changing status
  const { request: checkHistory } = useApi<any>()

  const [vaccineLots, setVaccineLots] = useState<VaccineLot[]>([])
  const [currentDose, setCurrentDose] = useState(1)
  const [showHistoryForm, setShowHistoryForm] = useState(false)
  const [patientHasHistory, setPatientHasHistory] = useState(false)
  const [activeTab, setActiveTab] = useState("attend")
  const [notAdministeredReason, setNotAdministeredReason] = useState("")
  const [showNotAdministeredDialog, setShowNotAdministeredDialog] = useState(false)
  const [showConfirmVaccinationDialog, setShowConfirmVaccinationDialog] = useState(false) // State for the reason

  const form = useForm<z.infer<typeof attendSchema>>({
    resolver: zodResolver(attendSchema),
    defaultValues: {
      id_LoteVacuna: "",
      dosisNumero: 1,
      requiereProximaDosis: false,
      fechaProximaDosis: "",
      horaProximaDosis: "",
      agendarProximaCita: false,
    },
  })

  const watchRequiereProximaDosis = form.watch("requiereProximaDosis")

  useEffect(() => {
    if (!isOpen || !appointment) return;

    (async () => {
      await loadVaccineLots();
      let hasHistory = !!appointment.TieneHistorial;
      try {
        const data = await checkHistory("/api/medical/patient-full-history", {
          method: "POST",
          body: {
            id_Usuario: patientId,
            id_Nino: appointment.id_Nino || null,
          },
        });
        // The API returns an object { medicalHistory, vaccinationHistory }.
        // We check if medicalHistory.FechaCreacion is not null to confirm it has been initialized.
        if (data && data.medicalHistory && data.medicalHistory.FechaCreacion) {
          hasHistory = true;
        } else {
          hasHistory = false;
        }
      } catch {
        // ignore error, use fallback
      }
      setPatientHasHistory(hasHistory);
      setShowHistoryForm(!hasHistory);

      const nextDose = (appointment.DosisAplicadas || 0) + 1;
      setCurrentDose(nextDose);
      form.setValue("dosisNumero", nextDose);

      setActiveTab(hasHistory ? "attend" : "history");
    })();
  }, [isOpen, appointment]);

  const loadVaccineLots = async () => {
    try {
      if (!centerId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se ha seleccionado un centro de vacunación.",
        });
        return;
      }
      const data = await fetchLots(`/api/medical/vaccine-lots/${appointment.id_Vacuna}?id_centro=${centerId}`)
      setVaccineLots(data || [])
    } catch (error) {
      console.error("Error loading vaccine lots:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los lotes de vacuna",
      })
    }
  }

  const handleHistoryCreated = () => {
    setPatientHasHistory(true)
    setShowHistoryForm(false)
    setActiveTab("attend")
    toast({
      title: "Historial Actualizado",
      description: "Ahora puede proceder con la atención médica",
    })
  }

  const onSubmit = async (values: z.infer<typeof attendSchema>) => {
    if (!patientHasHistory) {
      toast({
        variant: "destructive",
        title: "Historial Requerido",
        description: "Debe crear el historial médico del paciente antes de atender la cita",
      })
      setActiveTab("history")
      return
    }

    try {
      const payload = {
        id_Cita: appointment.id_Cita,
        id_LoteVacuna: Number.parseInt(values.id_LoteVacuna),
        dosisNumero: values.dosisNumero,
        requiereProximaDosis: values.requiereProximaDosis,
        fechaProximaDosis: values.fechaProximaDosis || null,
        horaProximaDosis: values.horaProximaDosis || null,
        agendarProximaCita: values.agendarProximaCita,
      }

      await attendAppointment("/api/medical/attend-appointment", {
        method: "POST",
        body: payload,
      })

      toast({
        title: "Cita Atendida",
        description: "La vacuna ha sido aplicada exitosamente",
      })

      onSuccess()
    } catch (error) {
      console.error("Error attending appointment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar la atención de la cita",
      })
    }
  }

  const handleNotAdministered = async () => {
    if (!notAdministeredReason.trim()) {
      toast({
        variant: "destructive",
        title: "Motivo requerido",
        description: "Por favor indique el motivo por el cual no se suministró la vacuna.",
      })
      return
    }

    try {
      await changeStatus("/api/medical/change-status", {
        method: "POST",
        body: {
          id_Cita: appointment.id_Cita,
          nuevoEstado: "Cancelada por Centro",
          notas: notAdministeredReason,
        },
      })

      toast({
        title: "Estado Actualizado",
        description: "La cita ha sido marcada como No Suministrada.",
      })
      onSuccess()
    } catch (error) {
      console.error("Error changing status:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado de la cita.",
      })
    }
  }

  // Calculate minimum date for next dose (usually 21-28 days later)
  const getMinNextDoseDate = () => {
    const today = new Date()
    const minDate = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000) // 21 days from today
    return minDate.toISOString().split("T")[0]
  }

  if (!appointment) return null

  const isLastDose = currentDose >= appointment.DosisLimite

  // Date check
  const appointmentDate = new Date(appointment.Fecha);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  appointmentDate.setHours(0, 0, 0, 0);

  // Check if appointment is in the future relative to today
  // We use the string format if available to be safer on timezones, but date object comparison works for simple day check if normalized
  const safeFutureCheck = appointmentDate > today;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            Atender Cita Médica
          </DialogTitle>
          <DialogDescription>
            Aplicar vacuna y registrar información médica para <strong>{appointment.NombrePaciente}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attend" disabled={!patientHasHistory}>
              <Syringe className="h-4 w-4 mr-2" />
              Atender Cita
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="h-4 w-4 mr-2" />
              {patientHasHistory ? "Ver Historial" : "Crear Historial"}
            </TabsTrigger>
            <TabsTrigger value="vaccines">
              <History className="h-4 w-4 mr-2" />
              Historial Vacunas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {showHistoryForm ? (
              <PatientHistoryForm
                patientId={patientId}
                childId={appointment.id_Nino}
                patientName={appointment.NombrePaciente}
                birthDate={appointment.FechaNacimiento}
                onSuccess={handleHistoryCreated}
              />
            ) : (
              <PatientHistoryView
                patientId={patientId}
                childId={appointment.id_Nino}
                showVaccinesOnly={false}
                hideVaccinationSection={true}
              />
            )}
          </TabsContent>

          <TabsContent value="vaccines" className="space-y-4">
            <PatientHistoryView
              patientId={patientId}
              childId={appointment.id_Nino}
              showVaccinesOnly={true}
            />
          </TabsContent>

          <TabsContent value="attend" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Appointment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Información de la Cita
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Paciente</span>
                        <p className="font-semibold">{appointment.NombrePaciente}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Fecha</span>
                        <p>{formatDateString(appointment.Fecha)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Hora</span>
                        <p>{formatTimeString(appointment.Hora)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Vacuna</span>
                        <p className="font-medium text-blue-600">{appointment.NombreVacuna}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vaccination Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Syringe className="h-5 w-5" />
                      Detalles de la Vacunación
                    </CardTitle>
                    <CardDescription>
                      Dosis {currentDose} de {appointment.DosisLimite}
                      {isLastDose && " (Última dosis del esquema)"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="id_LoteVacuna"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Lote de Vacuna *
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-auto py-2 text-left">
                                  {field.value && vaccineLots.find(l => l.id_LoteVacuna.toString() === field.value) ? (
                                    <div className="flex flex-col items-start gap-0.5">
                                      <span className="font-medium text-sm">
                                        Lote: {vaccineLots.find(l => l.id_LoteVacuna.toString() === field.value)?.NumeroLote}
                                      </span>
                                      <span className="text-xs text-gray-500 font-normal">
                                        {vaccineLots.find(l => l.id_LoteVacuna.toString() === field.value)?.NombreFabricante} - Vence: {formatDateString(vaccineLots.find(l => l.id_LoteVacuna.toString() === field.value)?.FechaCaducidad || "")}
                                      </span>
                                    </div>
                                  ) : (
                                    <SelectValue placeholder="Seleccionar lote de vacuna" />
                                  )}
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {loadingLots ? (
                                  <div className="flex items-center justify-center p-4">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                  </div>
                                ) : (
                                  vaccineLots.map((lot) => (
                                    <SelectItem key={lot.id_LoteVacuna} value={lot.id_LoteVacuna.toString()}>
                                      <div className="flex flex-col items-start gap-0.5">
                                        <span className="font-medium">Lote: {lot.NumeroLote}</span>
                                        <span className="text-xs text-gray-500">
                                          {lot.NombreFabricante} - Vence: {formatDateString(lot.FechaCaducidad)}
                                        </span>
                                        <span className="text-xs text-green-600">Disponible: {lot.CantidadDisponible}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dosisNumero"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Dosis</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max={appointment.DosisLimite}
                                {...field}
                                readOnly
                                className="bg-gray-50 text-black"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {vaccineLots.length === 0 && !loadingLots && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                        <XCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          No hay lotes disponibles o vigentes para esta vacuna en este centro.
                        </span>
                      </div>
                    )}

                    {form.watch("id_LoteVacuna") && vaccineLots.find(l => l.id_LoteVacuna.toString() === form.watch("id_LoteVacuna")) && (
                      (() => {
                        const selectedLot = vaccineLots.find(l => l.id_LoteVacuna.toString() === form.watch("id_LoteVacuna"));
                        const apptDate = new Date(appointment.Fecha);
                        apptDate.setHours(0, 0, 0, 0);
                        const isExpired = selectedLot ? new Date(selectedLot.FechaCaducidad) < apptDate : false;
                        if (isExpired) {
                          return (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                              <XCircle className="h-5 w-5" />
                              <span className="text-sm font-medium">
                                ¡ATENCIÓN! El lote seleccionado ({selectedLot?.NumeroLote}) ya ha caducado para la fecha de la cita ({formatDateString(appointment.Fecha)}). No suministrar.
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()
                    )}
                  </CardContent>
                </Card>

                {/* Next Dose Scheduling */}
                {/* Next Dose Scheduling Removed as per user request */}

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowNotAdministeredDialog(true)}
                    disabled={changingStatus}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    No Suministrada
                  </Button>
                  <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setShowConfirmVaccinationDialog(true)}
                    disabled={
                      attending ||
                      !patientHasHistory ||
                      !form.watch("id_LoteVacuna") ||
                      (() => {
                        const selectedLot = vaccineLots.find(l => l.id_LoteVacuna.toString() === form.watch("id_LoteVacuna"));
                        const apptDate = new Date(appointment.Fecha);
                        apptDate.setHours(0, 0, 0, 0);
                        return selectedLot ? new Date(selectedLot.FechaCaducidad) < apptDate : true;
                      })()
                    }>
                    <Syringe className="mr-2 h-4 w-4" />
                    Confirmar Vacunación
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

        </Tabs>
      </DialogContent>

      {/* Dialog for "No Suministrada" */}
      <Dialog open={showNotAdministeredDialog} onOpenChange={setShowNotAdministeredDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Marcar como No Suministrada</DialogTitle>
            <DialogDescription>
              Por favor indique el motivo por el cual no se suministrará la vacuna.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Ej: Paciente presenta fiebre alta, rechazo del tutor, falta de insumos..."
              value={notAdministeredReason}
              onChange={(e) => setNotAdministeredReason(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotAdministeredDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!notAdministeredReason.trim()) {
                  toast({
                    variant: "destructive",
                    title: "Motivo requerido",
                    description: "Por favor indique el motivo.",
                  })
                  return
                }
                setShowNotAdministeredDialog(false)
                handleNotAdministered()
              }}
              disabled={changingStatus}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Vaccination Confirmation */}
      <Dialog open={showConfirmVaccinationDialog} onOpenChange={setShowConfirmVaccinationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">Confirmar Vacunación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea registrar la aplicación de esta vacuna?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Esta acción registrará la vacuna como aplicada y actualizará el historial del paciente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmVaccinationDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setShowConfirmVaccinationDialog(false)
                form.handleSubmit(onSubmit)()
              }}
              disabled={attending}
            >
              Confirmar Vacunación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
