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
import { Calendar, Syringe, Package, FileText, History } from "lucide-react"
import { formatDateString, formatTimeString } from "@/utils/format-time"
import { PatientHistoryForm } from "./patient-history-form"
import { PatientHistoryView } from "./patient-history-view"

interface MedicalAppointment {
  id_Cita: number
  NombrePaciente: string
  Fecha: string
  Hora: string
  NombreVacuna: string
  DosisLimite: number
  id_Vacuna: number
  NombreCentro: string
  EstadoCita: string
  id_EstadoCita: number
  RequiereTutor: boolean
  id_UsuarioRegistraCita: number
  id_Nino?: number
  TieneHistorial: boolean
  DosisAplicadas?: number
}

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
  notasAdicionales: z.string().optional(),
  alergias: z.string().optional(),
  requiereProximaDosis: z.boolean().default(false),
  fechaProximaDosis: z.string().optional(),
  agendarProximaCita: z.boolean().default(false),
})

interface AttendAppointmentModalProps {
  appointment: MedicalAppointment
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AttendAppointmentModal({ appointment, isOpen, onClose, onSuccess }: AttendAppointmentModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { request: fetchLots, loading: loadingLots } = useApi<VaccineLot[]>()
  const { request: attendAppointment, loading: attending } = useApi()

  const [vaccineLots, setVaccineLots] = useState<VaccineLot[]>([])
  const [currentDose, setCurrentDose] = useState(1)
  const [showHistoryForm, setShowHistoryForm] = useState(false)
  const [patientHasHistory, setPatientHasHistory] = useState(false)
  const [activeTab, setActiveTab] = useState("attend")

  const form = useForm<z.infer<typeof attendSchema>>({
    resolver: zodResolver(attendSchema),
    defaultValues: {
      id_LoteVacuna: "",
      dosisNumero: 1,
      notasAdicionales: "",
      alergias: "",
      requiereProximaDosis: false,
      fechaProximaDosis: "",
      agendarProximaCita: false,
    },
  })

  const watchRequiereProximaDosis = form.watch("requiereProximaDosis")

  useEffect(() => {
    if (isOpen && appointment) {
      loadVaccineLots()
      setPatientHasHistory(appointment.TieneHistorial)
      setShowHistoryForm(!appointment.TieneHistorial)

      // Calculate current dose number
      const nextDose = (appointment.DosisAplicadas || 0) + 1
      setCurrentDose(nextDose)
      form.setValue("dosisNumero", nextDose)

      // Set default tab based on history
      if (appointment.TieneHistorial) {
        setActiveTab("attend")
      } else {
        setActiveTab("history")
      }
    }
  }, [isOpen, appointment])

  const loadVaccineLots = async () => {
    try {
      const data = await fetchLots(`/api/medical/vaccine-lots/${appointment.id_Vacuna}`)
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
      title: "Historial Creado",
      description: "El historial médico ha sido registrado exitosamente",
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
        notasAdicionales: values.notasAdicionales || "",
        alergias: values.alergias || "",
        requiereProximaDosis: values.requiereProximaDosis,
        fechaProximaDosis: values.fechaProximaDosis || null,
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

  const isLastDose = currentDose >= appointment.DosisLimite
  const needsNextDose = currentDose < appointment.DosisLimite

  // Calculate minimum date for next dose (usually 21-28 days later)
  const getMinNextDoseDate = () => {
    const today = new Date()
    today.setDate(today.getDate() + 21) // 3 weeks minimum
    return today.toISOString().split("T")[0]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            Atender Paciente - {appointment.NombrePaciente}
          </DialogTitle>
          <DialogDescription>
            {!patientHasHistory
              ? "Primero debe crear el historial médico del paciente"
              : "Registrar la aplicación de la vacuna y completar el historial médico"}
          </DialogDescription>
        </DialogHeader>

        {/* Patient Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{appointment.NombrePaciente}</CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span>
                {formatDateString(appointment.Fecha)} - {formatTimeString(appointment.Hora)}
              </span>
              {appointment.RequiereTutor && <Badge variant="secondary">Menor de edad</Badge>}
              <Badge variant={patientHasHistory ? "default" : "destructive"}>
                {patientHasHistory ? "Con Historial" : "Sin Historial"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Vacuna:</span> {appointment.NombreVacuna}
              </div>
              <div>
                <span className="font-medium">Dosis límite:</span> {appointment.DosisLimite}
              </div>
              <div>
                <span className="font-medium">Dosis aplicadas:</span> {appointment.DosisAplicadas || 0}
              </div>
              <div>
                <span className="font-medium">Dosis actual:</span>
                <Badge variant="outline" className="ml-2">
                  {currentDose} de {appointment.DosisLimite}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {patientHasHistory ? "Ver Historial" : "Crear Historial"}
            </TabsTrigger>
            <TabsTrigger value="vaccines" className="flex items-center gap-2" disabled={!patientHasHistory}>
              <History className="h-4 w-4" />
              Vacunas Previas
            </TabsTrigger>
            <TabsTrigger value="attend" className="flex items-center gap-2" disabled={!patientHasHistory}>
              <Syringe className="h-4 w-4" />
              Atender Cita
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {!patientHasHistory ? (
              <PatientHistoryForm
                patientId={appointment.id_UsuarioRegistraCita}
                childId={appointment.id_Nino}
                patientName={appointment.NombrePaciente}
                onSuccess={handleHistoryCreated}
              />
            ) : (
              <PatientHistoryView patientId={appointment.id_UsuarioRegistraCita} childId={appointment.id_Nino} />
            )}
          </TabsContent>

          <TabsContent value="vaccines" className="space-y-4">
            <PatientHistoryView
              patientId={appointment.id_UsuarioRegistraCita}
              childId={appointment.id_Nino}
              showVaccinesOnly={true}
            />
          </TabsContent>

          <TabsContent value="attend" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Vaccine Lot Selection */}
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
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el lote a utilizar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingLots ? (
                            <SelectItem value="loading" disabled>
                              Cargando lotes...
                            </SelectItem>
                          ) : vaccineLots.length > 0 ? (
                            vaccineLots.map((lot) => (
                              <SelectItem key={lot.id_LoteVacuna} value={lot.id_LoteVacuna.toString()}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{lot.NumeroLote}</span>
                                  <span className="text-xs text-gray-500">
                                    {lot.NombreFabricante} - Disponible: {lot.CantidadDisponible} - Vence:{" "}
                                    {new Date(lot.FechaCaducidad).toLocaleDateString()}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-lots" disabled>
                              No hay lotes disponibles
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dose Information */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dosisNumero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Dosis</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} min={1} max={appointment.DosisLimite} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center space-x-2 pt-8">
                    {isLastDose ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Última dosis
                      </Badge>
                    ) : (
                      <Badge variant="outline">Requiere {appointment.DosisLimite - currentDose} dosis más</Badge>
                    )}
                  </div>
                </div>

                {/* Medical Notes */}
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="alergias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alergias o Reacciones</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Registre cualquier alergia conocida o reacción observada..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notasAdicionales"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Adicionales</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Observaciones médicas, recomendaciones, etc..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Next Dose Section */}
                {needsNextDose && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Próxima Dosis
                      </CardTitle>
                      <CardDescription>
                        Este paciente requiere dosis adicionales para completar el esquema de vacunación
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="requiereProximaDosis"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Programar próxima dosis</FormLabel>
                              <p className="text-sm text-gray-600">
                                Marque esta opción para programar la siguiente dosis
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      {watchRequiereProximaDosis && (
                        <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                          <FormField
                            control={form.control}
                            name="fechaProximaDosis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fecha para la próxima dosis *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} min={getMinNextDoseDate()} />
                                </FormControl>
                                <p className="text-xs text-gray-500">Mínimo 21 días desde hoy</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="agendarProximaCita"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Agendar cita automáticamente</FormLabel>
                                  <p className="text-sm text-gray-600">
                                    El sistema creará una nueva cita para la fecha seleccionada
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={attending || !patientHasHistory}>
                    {attending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Syringe className="mr-2 h-4 w-4" />
                        Completar Atención
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
