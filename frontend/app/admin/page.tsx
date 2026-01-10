"use client"


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { Users, Calendar, AlertTriangle, TrendingUp, Syringe, Clock, CheckCircle } from "lucide-react"

import useApi from "@/hooks/use-api"
import { useEffect } from "react"

export default function AdminDashboardPage() {
  const { user } = useAuth()

  const { data: stats, request: fetchStats } = useApi<any>()
  const { data: alerts, request: fetchAlerts } = useApi<any[]>()
  const { data: appointments, request: fetchAppointments } = useApi<any[]>()

  useEffect(() => {
    fetchStats("/api/dashboard/stats")
    fetchAlerts("/api/dashboard/alerts")
    fetchAppointments("/api/dashboard/appointments")
  }, [fetchStats, fetchAlerts, fetchAppointments])

  const displayStats = stats || {
    totalPatients: 0,
    todayAppointments: 0,
    completedVaccinations: 0,
    pendingAlerts: 0,
  }

  const displayAlerts = alerts || []
  const displayAppointments = appointments || []

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido, {user?.email}. Aquí tienes un resumen de la actividad del sistema.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.totalPatients.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.todayAppointments}</div>
              <p className="text-xs text-muted-foreground">Actividad del día</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vacunaciones</CardTitle>
              <Syringe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.completedVaccinations}</div>
              <p className="text-xs text-muted-foreground">Total histórico</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.pendingAlerts}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Alerts Section */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas y Notificaciones
              </CardTitle>
              <CardDescription>Información importante que requiere tu atención</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayAlerts.length > 0 ? displayAlerts.map((alert: any, idx: number) => (
                <div key={idx} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                    {alert.type === "info" && <Clock className="h-4 w-4 text-blue-500 mt-0.5" />}
                    {alert.type === "success" && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium">{alert.message}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      alert.priority === "high" ? "destructive" : alert.priority === "medium" ? "default" : "secondary"
                    }
                  >
                    {alert.priority === "high" ? "Alta" : alert.priority === "medium" ? "Media" : "Baja"}
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-4 text-muted-foreground text-sm">No hay alertas activas</div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Citas
              </CardTitle>
              <CardDescription>Citas programadas para hoy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayAppointments.length > 0 ? displayAppointments.map((appointment: any) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{appointment.patient}</p>
                    <p className="text-xs text-muted-foreground">{appointment.vaccine}</p>
                    <p className="text-xs text-muted-foreground">{appointment.center}</p>
                  </div>
                  <Badge variant="outline">{appointment.time}</Badge>
                </div>
              )) : (
                <div className="text-center py-4 text-muted-foreground text-sm">No hay citas para hoy</div>
              )}
              <Button variant="outline" className="w-full">
                Ver todas las citas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/admin/users" passHref>
                <Button className="h-20 w-full flex-col gap-2">
                  <Users className="h-6 w-6" />
                  Registrar Paciente
                </Button>
              </Link>
              <Link href="/management/medical/select-center" passHref>
                <Button variant="outline" className="h-20 w-full flex-col gap-2">
                  <Syringe className="h-6 w-6" />
                  Nueva Vacunación
                </Button>
              </Link>
              <Link href="/agendar" passHref>
                <Button variant="outline" className="h-20 w-full flex-col gap-2">
                  <Calendar className="h-6 w-6" />
                  Agendar Cita
                </Button>
              </Link>
              <Link href="/reports" passHref>
                <Button variant="outline" className="h-20 w-full flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Ver Reportes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
