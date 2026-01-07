"use client"

import { useEffect, useState, useCallback } from "react"
import useApi from "@/hooks/use-api"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  CheckCircle,
  UserCheck,
  Edit,
  Calendar,
  Clock,
  Syringe,
  Users,
  Search,
  Filter,
  History,
  Package,
} from "lucide-react"
import { formatTimeString, formatDateString } from "@/utils/format-time"
import { InventoryTabContent } from "@/components/inventory/inventory-tab-content"

interface Appointment {
  id_Cita: number
  NombrePaciente: string
  Fecha: string
  Hora: string
  NombreVacuna: string
  DescripcionVacuna?: string
  id_Vacuna: number
  NombreCentro: string
  EstadoCita: string
  id_EstadoCita: number
  RequiereTutor: boolean
  NombreCompletoPersonalAplicado: string | null
  id_PersonalSalud: number | null
  NombrePersonalSalud: string | null
}

interface Medico {
  id_Usuario: number
  NombreCompleto: string
  Nombre?: string
  Apellido?: string
  Email: string
}

interface EditAppointmentData {
  id_Cita: number
  Fecha: string
  Hora: string
  id_PersonalSalud: number | null
}

interface SearchFilters {
  paciente: string
  medico: string
  vacuna: string
  centro: string
  fechaInicio: string
  fechaFin: string
}

export const AppointmentsManagementEnhanced = ({ onDataRefresh }: { onDataRefresh: () => void }) => {
  const { toast } = useToast()
  const { request: fetchAppointments, loading } = useApi()
  const { request: fetchMedicos, loading: loadingMedicos } = useApi()
  const { request: assignMedico, loading: assigningMedico } = useApi()
  const { request: confirmAppointment, loading: confirmingAppointment } = useApi()
  const { request: updateAppointment, loading: updatingAppointment } = useApi()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [userRole, setUserRole] = useState<number | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<EditAppointmentData | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Estados para búsqueda avanzada
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    paciente: "",
    medico: "",
    vacuna: "",
    centro: "",
    fechaInicio: "",
    fechaFin: "",
  })
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  const loadAppointments = useCallback(async () => {
    try {
      const data = await fetchAppointments("/api/appointments")
      console.log("📋 Appointments loaded:", data)
      setAppointments(data || [])
    } catch (error) {
      toast({ variant: "destructive", title: "Error al cargar las citas" })
    }
  }, [fetchAppointments, toast])

  const loadMedicos = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]))
        console.log("👤 User role:", payload.id_Rol)
        setUserRole(payload.id_Rol)

        if (payload.id_Rol === 6) {
          const data = await fetchMedicos("/api/appointments/medicos")
          console.log("👨‍⚕️ Medicos loaded:", data)
          setMedicos(data || [])
        }
      }
    } catch (error) {
      console.error("Error loading medicos:", error)
    }
  }, [fetchMedicos])

  useEffect(() => {
    loadAppointments()
    loadMedicos()
  }, [loadAppointments, loadMedicos])

  const handleAssignMedico = async (appointmentId: number, medicoId: number) => {
    console.log(`🔄 Assigning medico ${medicoId} to appointment ${appointmentId}`)
    try {
      const response = await assignMedico(`/api/appointments/${appointmentId}/assign-medico`, {
        method: "PUT",
        body: { id_PersonalSalud: medicoId },
      })
      console.log("✅ Medico assigned successfully:", response)
      toast({ title: "Médico asignado exitosamente" })
      await loadAppointments()
    } catch (error) {
      console.error("❌ Error assigning medico:", error)
      toast({ variant: "destructive", title: "Error al asignar médico" })
    }
  }

  const handleConfirmAppointment = async (appointmentId: number, medicoId: number) => {
    console.log(`✅ Confirming appointment ${appointmentId} with medico ${medicoId}`)
    try {
      await confirmAppointment(`/api/appointments/${appointmentId}/confirm`, {
        method: "PUT",
        body: { id_PersonalSalud: medicoId },
      })
      toast({ title: "Cita confirmada exitosamente" })
      loadAppointments()
    } catch (error) {
      console.error("❌ Error confirming appointment:", error)
      toast({ variant: "destructive", title: "Error al confirmar la cita" })
    }
  }

  const handleEditAppointment = (appointment: Appointment) => {
    // Fix: Ensure proper time format for editing
    let formattedTime = appointment.Hora
    if (appointment.Hora) {
      // If time comes as HH:MM:SS, convert to HH:MM for the input
      if (appointment.Hora.includes(":")) {
        const timeParts = appointment.Hora.split(":")
        formattedTime = `${timeParts[0]}:${timeParts[1]}`
      }
    }

    setEditingAppointment({
      id_Cita: appointment.id_Cita,
      Fecha: appointment.Fecha.split("T")[0],
      Hora: formattedTime,
      id_PersonalSalud: appointment.id_PersonalSalud,
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingAppointment) return

    try {
      // Validate time format before sending
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(editingAppointment.Hora)) {
        toast({
          variant: "destructive",
          title: "Error de formato",
          description: "La hora debe estar en formato HH:MM (ej: 14:30)",
        })
        return
      }

      console.log("🔄 Saving appointment edit:", {
        id: editingAppointment.id_Cita,
        Fecha: editingAppointment.Fecha,
        Hora: editingAppointment.Hora,
        id_PersonalSalud: editingAppointment.id_PersonalSalud,
      })

      await updateAppointment(`/api/appointments/${editingAppointment.id_Cita}/edit`, {
        method: "PUT",
        body: {
          Fecha: editingAppointment.Fecha,
          Hora: editingAppointment.Hora,
          id_PersonalSalud: editingAppointment.id_PersonalSalud,
        },
      })
      toast({ title: "Cita actualizada exitosamente" })
      setIsEditDialogOpen(false)
      setEditingAppointment(null)
      await loadAppointments()
    } catch (error) {
      console.error("❌ Error updating appointment:", error)
      toast({ variant: "destructive", title: "Error al actualizar la cita" })
    }
  }

  // Filtrar citas por estado
  const agendadasAppointments = appointments.filter((a) => a.id_EstadoCita === 1) // Agendadas
  const confirmadasAppointments = appointments.filter((a) => a.id_EstadoCita === 2) // Confirmadas
  const asistidasAppointments = appointments.filter((a) => a.id_EstadoCita === 3) // Asistidas

  // Filtrar citas asistidas según búsqueda
  const filteredAsistidas = asistidasAppointments.filter((appointment) => {
    const matchesPaciente =
      !searchFilters.paciente || appointment.NombrePaciente.toLowerCase().includes(searchFilters.paciente.toLowerCase())

    const matchesMedico =
      !searchFilters.medico ||
      (appointment.NombrePersonalSalud &&
        appointment.NombrePersonalSalud.toLowerCase().includes(searchFilters.medico.toLowerCase()))

    const matchesVacuna =
      !searchFilters.vacuna || appointment.NombreVacuna.toLowerCase().includes(searchFilters.vacuna.toLowerCase())

    const matchesCentro =
      !searchFilters.centro || appointment.NombreCentro.toLowerCase().includes(searchFilters.centro.toLowerCase())

    const appointmentDate = new Date(appointment.Fecha)
    const matchesFechaInicio = !searchFilters.fechaInicio || appointmentDate >= new Date(searchFilters.fechaInicio)

    const matchesFechaFin = !searchFilters.fechaFin || appointmentDate <= new Date(searchFilters.fechaFin)

    return matchesPaciente && matchesMedico && matchesVacuna && matchesCentro && matchesFechaInicio && matchesFechaFin
  })

  const clearFilters = () => {
    setSearchFilters({
      paciente: "",
      medico: "",
      vacuna: "",
      centro: "",
      fechaInicio: "",
      fechaFin: "",
    })
  }

  const renderAppointmentRow = (appointment: Appointment, showActions = true) => {
    const hasAssignedDoctor = appointment.id_PersonalSalud !== null && appointment.id_PersonalSalud !== undefined
    const isConfirmed = appointment.EstadoCita === "Confirmada"
    const isAsistida = appointment.id_EstadoCita === 3
    const canEdit = userRole === 6 && !isAsistida // Permitir editar todo excepto Asistidas
    const canConfirm = userRole === 6 && appointment.EstadoCita === "Agendada" && hasAssignedDoctor

    return (
      <TableRow key={appointment.id_Cita}>
        <TableCell>
          <div className="flex items-center space-x-2">
            {appointment.RequiereTutor ? (
              <UserCheck className="h-4 w-4 text-pink-500" />
            ) : (
              <Users className="h-4 w-4 text-blue-500" />
            )}
            <div className="flex flex-col">
              <span className="font-medium">{appointment.NombrePaciente}</span>
              {appointment.RequiereTutor && <span className="text-xs text-gray-500">Registrado por tutor</span>}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="font-medium">{formatDateString(appointment.Fecha)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">{formatTimeString(appointment.Hora)}</span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <Syringe className="h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <Badge variant="outline" className="text-xs font-medium">
                {appointment.NombreVacuna}
              </Badge>
              {appointment.DescripcionVacuna && (
                <span className="text-xs text-gray-500 mt-1">{appointment.DescripcionVacuna}</span>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-sm">{appointment.NombreCentro}</TableCell>
        <TableCell>
          <Badge
            variant={
              appointment.EstadoCita === "Agendada"
                ? "secondary"
                : appointment.EstadoCita === "Confirmada"
                  ? "default"
                  : appointment.EstadoCita === "Asistida"
                    ? "outline"
                    : "outline"
            }
            className={
              appointment.EstadoCita === "Agendada"
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : appointment.EstadoCita === "Confirmada"
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : appointment.EstadoCita === "Asistida"
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    : ""
            }
          >
            {appointment.EstadoCita}
          </Badge>
        </TableCell>
        {userRole === 6 && (
          <TableCell>
            {!isAsistida && !isConfirmed && appointment.EstadoCita === "Agendada" ? (
              <Select
                value={appointment.id_PersonalSalud?.toString() || "0"}
                onValueChange={(value) => handleAssignMedico(appointment.id_Cita, Number.parseInt(value))}
                disabled={assigningMedico}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicos.map((medico) => (
                    <SelectItem key={medico.id_Usuario} value={medico.id_Usuario.toString()}>
                      {medico.NombreCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : appointment.NombrePersonalSalud ? (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{appointment.NombrePersonalSalud}</span>
                  {isConfirmed && <span className="text-xs text-green-600">Confirmado</span>}
                  {isAsistida && <span className="text-xs text-blue-600">Atendió</span>}
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Sin asignar</span>
            )}
          </TableCell>
        )}
        {showActions && (
          <TableCell className="text-right">
            <div className="flex gap-2 justify-end">
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => handleEditAppointment(appointment)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              )}

              {canConfirm && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleConfirmAppointment(appointment.id_Cita, appointment.id_PersonalSalud!)}
                  disabled={confirmingAppointment}
                >
                  {confirmingAppointment ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="mr-2 h-4 w-4" />
                  )}
                  Confirmar Cita
                </Button>
              )}
            </div>
          </TableCell>
        )}
      </TableRow>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const title = userRole === 6 ? "Gestión de Citas del Centro" : "Gestión de Citas"

  return (
    <div className="p-4 border rounded-md mt-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      {/* Leyenda explicativa */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-4 text-sm text-blue-800">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Adulto (cita propia)</span>
          </div>
          <div className="flex items-center gap-1">
            <UserCheck className="h-4 w-4" />
            <span>Niño (cita registrada por tutor)</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="agendadas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agendadas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agendadas ({agendadasAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="confirmadas" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Confirmadas ({confirmadasAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial ({asistidasAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="inventario" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agendadas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Citas Agendadas
              </CardTitle>
              <CardDescription>Citas programadas pendientes de confirmación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Vacuna</TableHead>
                      <TableHead>Centro</TableHead>
                      <TableHead>Estado</TableHead>
                      {userRole === 6 && <TableHead>Médico Asignado</TableHead>}
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{agendadasAppointments.map((appointment) => renderAppointmentRow(appointment))}</TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmadas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Citas Confirmadas
              </CardTitle>
              <CardDescription>Citas confirmadas con médico asignado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Vacuna</TableHead>
                      <TableHead>Centro</TableHead>
                      <TableHead>Estado</TableHead>
                      {userRole === 6 && <TableHead>Médico Asignado</TableHead>}
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmadasAppointments.map((appointment) => renderAppointmentRow(appointment))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Citas Asistidas
              </CardTitle>
              <CardDescription>Búsqueda avanzada de citas completadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Búsqueda Avanzada */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    {showAdvancedSearch ? "Ocultar Filtros" : "Mostrar Filtros"}
                  </Button>
                  {Object.values(searchFilters).some((v) => v !== "") && (
                    <Button variant="ghost" onClick={clearFilters} size="sm">
                      Limpiar Filtros
                    </Button>
                  )}
                </div>

                {showAdvancedSearch && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Paciente</label>
                      <Input
                        placeholder="Buscar por nombre del paciente"
                        value={searchFilters.paciente}
                        onChange={(e) => setSearchFilters((prev) => ({ ...prev, paciente: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Médico</label>
                      <Input
                        placeholder="Buscar por nombre del médico"
                        value={searchFilters.medico}
                        onChange={(e) => setSearchFilters((prev) => ({ ...prev, medico: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Vacuna</label>
                      <Input
                        placeholder="Buscar por tipo de vacuna"
                        value={searchFilters.vacuna}
                        onChange={(e) => setSearchFilters((prev) => ({ ...prev, vacuna: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Centro</label>
                      <Input
                        placeholder="Buscar por centro"
                        value={searchFilters.centro}
                        onChange={(e) => setSearchFilters((prev) => ({ ...prev, centro: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Fecha Inicio</label>
                      <Input
                        type="date"
                        value={searchFilters.fechaInicio}
                        onChange={(e) => setSearchFilters((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Fecha Fin</label>
                      <Input
                        type="date"
                        value={searchFilters.fechaFin}
                        onChange={(e) => setSearchFilters((prev) => ({ ...prev, fechaFin: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Resultados */}
              <div className="text-sm text-gray-600 mb-2">
                Mostrando {filteredAsistidas.length} de {asistidasAppointments.length} citas asistidas
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Vacuna</TableHead>
                      <TableHead>Centro</TableHead>
                      <TableHead>Estado</TableHead>
                      {userRole === 6 && <TableHead>Médico que Atendió</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAsistidas.length > 0 ? (
                      filteredAsistidas.map((appointment) => renderAppointmentRow(appointment, false))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={userRole === 6 ? 6 : 5} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="h-8 w-8 text-gray-400" />
                            <p className="text-gray-500">No se encontraron citas con los filtros aplicados</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventario" className="space-y-4">
          <InventoryTabContent />
        </TabsContent>
      </Tabs>

      {/* Dialog para editar cita */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
          </DialogHeader>
          {editingAppointment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="fecha" className="text-right">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Fecha
                </label>
                <Input
                  id="fecha"
                  type="date"
                  value={editingAppointment.Fecha}
                  onChange={(e) =>
                    setEditingAppointment({
                      ...editingAppointment,
                      Fecha: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="hora" className="text-right">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Hora
                </label>
                <Input
                  id="hora"
                  type="time"
                  value={editingAppointment.Hora}
                  onChange={(e) =>
                    setEditingAppointment({
                      ...editingAppointment,
                      Hora: e.target.value,
                    })
                  }
                  className="col-span-3"
                  step="60" // Only allow hour and minute selection
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="medico" className="text-right">
                  Médico
                </label>
                <Select
                  value={editingAppointment.id_PersonalSalud?.toString() || "0"}
                  onValueChange={(value) =>
                    setEditingAppointment({
                      ...editingAppointment,
                      id_PersonalSalud: value ? Number.parseInt(value) : null,
                    })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar médico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin asignar</SelectItem>
                    {medicos.map((medico) => (
                      <SelectItem key={medico.id_Usuario} value={medico.id_Usuario.toString()}>
                        {medico.NombreCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} disabled={updatingAppointment}>
                  {updatingAppointment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
