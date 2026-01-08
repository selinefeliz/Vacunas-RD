"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import useApi from "@/hooks/use-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ChildCardEnhanced, { EnhancedChild } from "@/components/children/child-card-enhanced"
import { Calendar, Clock, Users, AlertCircle, UserCheck, Stethoscope } from "lucide-react"
import AppointmentCard from "@/components/appointments/appointment-card"
import Link from "next/link"
import { formatTimeString, combineDateTime, formatDisplayDate } from "@/utils/format-time"

interface Appointment {
  id_Cita: number
  NombrePaciente: string
  Fecha: string
  Hora: string
  NombreVacuna: string
  NombreCentro: string
  EstadoCita: string
  id_EstadoCita?: number // 3 = Asistida
  RequiereTutor: boolean
  NombreCompletoPersonalAplicado: string | null
  id_PersonalSalud: number | null
  NombrePersonalSalud: string | null
}

export default function DashboardPage() {
  const { user, selectedCenter, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [allAppointments, setAllAppointments] = useState<Appointment[] | null>(null)
  const [childrenCount, setChildrenCount] = useState<number | null>(null)
  const [children, setChildren] = useState<EnhancedChild[]>([])
  const { request: callApi, loading: appointmentsLoading } = useApi()
  const { request: fetchChildren, loading: childrenLoading } = useApi<EnhancedChild[]>()

  const fetchAppointments = useCallback(async (centerId?: number) => {
    if (!user || !token) {
      return
    }
    try {
      let url = "/api/appointments"
      if (centerId) {
        url += `?id_CentroVacunacion=${centerId}`
      }
      const data = await callApi(url, {
        method: "GET",
      })
      console.log("📅 Appointments data received:", data) // Debug log
      setAllAppointments(data)
    } catch (err) {
      console.error("Failed to fetch appointments:", err)
      setAllAppointments([])
    }
  }, [user, token, callApi])

  // Fetch children for tutors
  const loadChildren = useCallback(async () => {
    if (!user || user.role !== "Tutor") return
    try {
      const data = await fetchChildren(`/api/ninos/tutor/${user.id}/detailed`)
      if (Array.isArray(data)) {
        setChildren(data)
        setChildrenCount(data.length)
      } else if (data && Array.isArray(data.recordset)) {
        setChildren(data.recordset)
        setChildrenCount(data.recordset.length)
      } else {
        setChildren([])
        setChildrenCount(0)
      }
    } catch (err) {
      console.error("Failed to fetch children:", err)
      setChildrenCount(0)
    }
  }, [user, fetchChildren])

  useEffect(() => {
    if (authLoading) return // Wait until authentication is resolved
    if (!user) {
      router.push("/login")
      return
    }

    // Redirect medical users to the correct page
    if (user && user.id_Rol === 2) {
      router.push('/admin/inventory');
      return // Stop further execution in this component
    }

    if (user && user.id_Rol === 3) {
      router.push('/management/medical/select-center');
      return // Stop further execution in this component
    }

    // Redirect center staff to their dashboard
    if (user && user.id_Rol === 6) {
      router.push('/management/availability'); // Correct path for center staff availability
      return
    }

    // Fetch appointments only if the user is a medical staff and a center is selected
    if ((user.role === "Medico" || user.role === "Enfermero") && selectedCenter) {
      fetchAppointments(selectedCenter.id_CentroVacunacion)
    } else if (user.role === "Enfermero" && user.id_CentroVacunacion) {
      // Fallback for nurses if selectedCenter is not a concept for them
      fetchAppointments(user.id_CentroVacunacion)
    }

    // For tutors (role "Tutor"), fetch their own appointments and their children’s
    if (user.role === "Tutor") {
      fetchAppointments();
      loadChildren();
    }
  }, [user, selectedCenter, authLoading, router, fetchAppointments, loadChildren])

  const handleViewProfile = (childId: number) => {
    router.push(`/children/${childId}/profile`)
  }

  const handleViewRequests = (childId: number) => {
    // Navigate to link requests specifically for this child if needed
    router.push(`/children/link`)
  }

  const upcomingAppointments = useMemo(() => {
    if (!allAppointments) return []

    return allAppointments
      .filter((appointment) =>
        appointment.EstadoCita !== "Completada" &&
        appointment.EstadoCita !== "Cancelada" &&
        appointment.id_EstadoCita !== 3 &&
        appointment.EstadoCita !== "Asistida"
      )
      .map((appointment) => ({
        ...appointment,
        combinedDate: combineDateTime(appointment.Fecha, appointment.Hora),
      }))
      .sort((a, b) => a.combinedDate.getTime() - b.combinedDate.getTime())
      .slice(0, 5)
  }, [allAppointments])

  const attendedAppointments = useMemo(() => {
    if (!allAppointments) return []

    return allAppointments
      .filter((a) => a.id_EstadoCita === 3 || a.EstadoCita === "Asistida")
      .map((a) => ({ ...a, combinedDate: combineDateTime(a.Fecha, a.Hora) }))
      .sort((a, b) => b.combinedDate.getTime() - a.combinedDate.getTime())
  }, [allAppointments])

  const renderAppointmentCard = (appointment: Appointment & { combinedDate?: Date }) => {
    const isConfirmed = appointment.EstadoCita === "Confirmada"
    const hasDoctor = appointment.NombrePersonalSalud && appointment.NombrePersonalSalud.trim() !== ""

    return (
      <div key={appointment.id_Cita} className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{appointment.NombreVacuna}</p>
            {appointment.RequiereTutor && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">👶 Niño</span>
            )}
            {isConfirmed && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                Confirmada
              </span>
            )}
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-4 w-4" />
            {appointment.combinedDate
              ? formatDisplayDate(appointment.combinedDate)
              : formatDisplayDate(combineDateTime(appointment.Fecha, appointment.Hora))}
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            {formatTimeString(appointment.Hora)}
          </div>

          <p className="text-sm text-muted-foreground">{appointment.NombreCentro}</p>
          <p className="text-sm font-medium text-gray-700">Paciente: {appointment.NombrePaciente}</p>

          {/* Mostrar médico si la cita está confirmada */}
          {isConfirmed && hasDoctor && (
            <div className="flex items-center text-sm text-green-700 bg-green-50 px-2 py-1 rounded-md mt-2">
              <Stethoscope className="mr-1 h-4 w-4" />
              <span className="font-medium">Dr(a). {appointment.NombrePersonalSalud}</span>
            </div>
          )}

          {/* Mostrar si está confirmada pero sin médico asignado */}
          {isConfirmed && !hasDoctor && (
            <div className="flex items-center text-sm text-amber-700 bg-amber-50 px-2 py-1 rounded-md mt-2">
              <AlertCircle className="mr-1 h-4 w-4" />
              <span>Confirmada - Médico por asignar</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${appointment.EstadoCita === "Confirmada"
              ? "bg-green-100 text-green-800"
              : appointment.EstadoCita === "Agendada"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-primary/10 text-primary"
              }`}
          >
            {appointment.EstadoCita}
          </span>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="container flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl font-bold">Cargando...</div>
          <p className="text-muted-foreground">Por favor espere mientras cargamos su información</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Router will redirect
  }

  return (
    <div className="container py-10 px-4 md:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Bienvenido, <span className="text-primary">{(user as any).nombre || user.email}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Gestione sus citas y registros de salud en un solo lugar.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-4 py-1.5 text-sm font-semibold border-primary/20 bg-primary/5 text-primary">
            Modo: {user.role}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="appointments">Citas</TabsTrigger>
          {user.role === "Tutor" && <TabsTrigger value="children">Niños</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Próximas Citas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                <p className="text-xs text-muted-foreground">
                  {upcomingAppointments.length === 0
                    ? "No tiene citas programadas"
                    : `Tiene ${upcomingAppointments.length} cita(s) pendiente(s)`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Estado</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Activo</div>
                <p className="text-xs text-muted-foreground">Su cuenta está activa y al día</p>
              </CardContent>
            </Card>

            {user.role === "Tutor" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Niños Registrados</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{childrenCount !== null ? childrenCount : "--"}</div>
                  <p className="text-xs text-muted-foreground">Niños bajo su tutela</p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Próximas Citas</CardTitle>
              <CardDescription>Visualice sus próximas citas de vacunación</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming">Próximas ({upcomingAppointments.length})</TabsTrigger>
                  <TabsTrigger value="attended">Asistidas ({attendedAppointments.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                  {appointmentsLoading ? (
                    <div className="flex h-40 items-center justify-center">
                      <p className="text-muted-foreground">Cargando citas...</p>
                    </div>
                  ) : upcomingAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingAppointments.map((appointment) => (
                        <AppointmentCard key={appointment.id_Cita} appointment={appointment} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-40 flex-col items-center justify-center space-y-3">
                      <p className="text-muted-foreground">No tiene citas programadas</p>
                      <Button asChild>
                        <Link href="/appointments/new">Agendar Cita</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="attended">
                  {appointmentsLoading ? (
                    <div className="flex h-40 items-center justify-center">
                      <p className="text-muted-foreground">Cargando citas...</p>
                    </div>
                  ) : attendedAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {attendedAppointments.map((appointment) => (
                        <AppointmentCard key={appointment.id_Cita} appointment={appointment} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center text-muted-foreground">
                      No tiene citas asistidas
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Todas las Citas</CardTitle>
                <CardDescription>Gestione todas sus citas de vacunación</CardDescription>
              </div>
              <Button asChild>
                <Link href="/appointments/new">Nueva Cita</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="flex h-60 items-center justify-center">
                  <p className="text-muted-foreground">Cargando citas...</p>
                </div>
              ) : allAppointments && allAppointments.length > 0 ? (
                <div className="space-y-4">
                  {allAppointments.map((appointment) => (
                    <div key={appointment.id_Cita} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{appointment.NombreVacuna}</p>
                          {appointment.RequiereTutor && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">👶 Niño</span>
                          )}
                          {appointment.EstadoCita === "Confirmada" && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              Confirmada
                            </span>
                          )}
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-1 h-4 w-4" />
                          {formatDisplayDate(combineDateTime(appointment.Fecha, appointment.Hora))}
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-1 h-4 w-4" />
                          {formatTimeString(appointment.Hora)}
                        </div>

                        <p className="text-sm text-muted-foreground">{appointment.NombreCentro}</p>
                        <p className="text-sm font-medium text-gray-700">Paciente: {appointment.NombrePaciente}</p>

                        {/* Mostrar médico si la cita está confirmada */}
                        {appointment.EstadoCita === "Confirmada" && appointment.NombrePersonalSalud && (
                          <div className="flex items-center text-sm text-green-700 bg-green-50 px-2 py-1 rounded-md mt-2">
                            <Stethoscope className="mr-1 h-4 w-4" />
                            <span className="font-medium">Dr(a). {appointment.NombrePersonalSalud}</span>
                          </div>
                        )}

                        {/* Mostrar si está confirmada pero sin médico asignado */}
                        {appointment.EstadoCita === "Confirmada" && !appointment.NombrePersonalSalud && (
                          <div className="flex items-center text-sm text-amber-700 bg-amber-50 px-2 py-1 rounded-md mt-2">
                            <AlertCircle className="mr-1 h-4 w-4" />
                            <span>Confirmada - Médico por asignar</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${appointment.EstadoCita === "Confirmada"
                            ? "bg-green-100 text-green-800"
                            : appointment.EstadoCita === "Agendada"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-primary/10 text-primary"
                            }`}
                        >
                          {appointment.EstadoCita}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/appointments/${appointment.id_Cita}`}>Ver Detalles</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-60 flex-col items-center justify-center space-y-3">
                  <p className="text-muted-foreground">No tiene citas registradas</p>
                  <Button asChild>
                    <Link href="/appointments/new">Agendar Cita</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === "Tutor" && (
          <TabsContent value="children">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Niños Registrados</CardTitle>
                  <CardDescription>Gestione los niños bajo su tutela</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/children/new">Registrar Niño</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {children.length > 0 ? (
                  <div className="space-y-4">
                    {children.map((child) => (
                      <ChildCardEnhanced
                        key={child.id_Nino}
                        child={child}
                        onViewProfile={handleViewProfile}
                        onViewRequests={handleViewRequests}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-60 flex-col items-center justify-center space-y-3">
                    <p className="text-muted-foreground">No tiene niños registrados</p>
                    <Button asChild>
                      <Link href="/children/new">Registrar Niño</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
