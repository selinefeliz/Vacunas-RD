"use client"

import { useState, useEffect, useCallback } from "react"
import useApi from "@/hooks/use-api"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, Syringe, MapPin, AlertCircle } from "lucide-react"
import { formatDateString, formatTimeString } from "@/utils/format-time"
import { AttendAppointmentModal } from "./attend-appointment-modal"

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
  EdadPaciente?: number
  TelefonoPaciente?: string
  EmailPaciente?: string
  DosisAplicadas?: number
}

export function MedicalAppointmentsView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { request: fetchAppointments, loading } = useApi<MedicalAppointment[]>()

  const [appointments, setAppointments] = useState<MedicalAppointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<MedicalAppointment | null>(null)
  const [isAttendModalOpen, setIsAttendModalOpen] = useState(false)

  const loadAppointments = useCallback(async () => {
    if (!user?.id) return

    try {
      const data = await fetchAppointments("/api/medical/appointments")
      console.log("📋 Medical appointments loaded:", data)
      setAppointments(data || [])
    } catch (error) {
      console.error("Error loading medical appointments:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las citas médicas",
      })
    }
  }, [fetchAppointments, user?.id, toast])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const handleAttendAppointment = (appointment: MedicalAppointment) => {
    setSelectedAppointment(appointment)
    setIsAttendModalOpen(true)
  }

  const handleAppointmentAttended = () => {
    setIsAttendModalOpen(false)
    setSelectedAppointment(null)
    loadAppointments() // Reload appointments
    toast({
      title: "Cita Atendida",
      description: "La cita ha sido procesada exitosamente",
    })
  }

  // Filter appointments by status
  const confirmedAppointments = appointments.filter((a) => a.id_EstadoCita === 2) // Confirmadas
  const todayAppointments = confirmedAppointments.filter((a) => {
    const appointmentDate = new Date(a.Fecha)
    const today = new Date()
    return appointmentDate.toDateString() === today.toDateString()
  })

  const upcomingAppointments = confirmedAppointments.filter((a) => {
    const appointmentDate = new Date(a.Fecha)
    const today = new Date()
    return appointmentDate > today
  })

  const renderAppointmentCard = (appointment: MedicalAppointment) => (
    <Card key={appointment.id_Cita} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              {appointment.NombrePaciente}
              {appointment.RequiereTutor && (
                <Badge variant="secondary" className="text-xs">
                  Menor de edad
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDateString(appointment.Fecha)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTimeString(appointment.Hora)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {appointment.NombreCentro}
              </span>
            </CardDescription>
          </div>
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
            {appointment.EstadoCita}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Syringe className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{appointment.NombreVacuna}</span>
            <Badge variant="outline" className="text-xs">
              Límite: {appointment.DosisLimite} dosis
            </Badge>
          </div>

          {appointment.DosisAplicadas !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>
                Dosis aplicadas: {appointment.DosisAplicadas} de {appointment.DosisLimite}
              </span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={() => handleAttendAppointment(appointment)} className="flex items-center gap-2">
              <Syringe className="h-4 w-4" />
              Atender Paciente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Citas de Hoy ({todayAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Próximas Citas ({upcomingAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Citas Programadas para Hoy
              </CardTitle>
              <CardDescription>Pacientes confirmados que deben ser atendidos hoy</CardDescription>
            </CardHeader>
            <CardContent>
              {todayAppointments.length > 0 ? (
                <div className="space-y-4">{todayAppointments.map(renderAppointmentCard)}</div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay citas programadas para hoy</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Próximas Citas Confirmadas
              </CardTitle>
              <CardDescription>Citas programadas para los próximos días</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">{upcomingAppointments.map(renderAppointmentCard)}</div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay citas próximas programadas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para atender cita */}
      {selectedAppointment && (
        <AttendAppointmentModal
          appointment={selectedAppointment}
          isOpen={isAttendModalOpen}
          onClose={() => {
            setIsAttendModalOpen(false)
            setSelectedAppointment(null)
          }}
          onSuccess={handleAppointmentAttended}
        />
      )}
    </div>
  )
}
