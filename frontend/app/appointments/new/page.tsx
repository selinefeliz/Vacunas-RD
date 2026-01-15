"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import useApi from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Calendar, ArrowLeft } from "lucide-react"

interface VaccinationCenter {
  id_CentroVacunacion: number
  Nombre: string
}

interface Vaccine {
  id_Vacuna: number
  Nombre: string
}

interface Child {
  id_Nino: number
  Nombres: string
  Apellidos: string
}

export default function NewAppointmentPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const [centers, setCenters] = useState<VaccinationCenter[]>([])
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [formData, setFormData] = useState({
    id_Nino: "",
    id_CentroVacunacion: "",
    id_Vacuna: "",
    FechaCita: "",
    HoraCita: "",
  })
  const [schedule, setSchedule] = useState<any[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [appointmentFor, setAppointmentFor] = useState<"self" | "child">("child")

  const { request: callApi, loading: dataLoading } = useApi()
  const { request: createAppointment, loading: formLoading } = useApi()

  const fetchInitialData = useCallback(async () => {
    if (!token) return
    try {
      const [centersData, vaccinesData] = await Promise.all([
        callApi("/api/vaccination-centers", { method: "GET" }),
        callApi("/api/vaccines", { method: "GET" }),
      ])

      setCenters(Array.isArray(centersData) ? centersData : (centersData?.recordset || []))
      setVaccines(Array.isArray(vaccinesData) ? vaccinesData : (vaccinesData?.recordset || []))

      if (user?.id_Rol === 5 || user?.role === "Tutor") {
        // Ajuste de endpoint de niños para tutor actual
        const data = await callApi(`/api/ninos/tutor/${user.id}/detailed`, { method: "GET" })
        const childrenList = Array.isArray(data) ? data : (data?.recordset || [])
        setChildren(childrenList)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos para agendar la cita",
      })
    }
  }, [callApi, token, user, toast])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (user) {
      fetchInitialData().then(() => {
        const childId = searchParams.get('childId');
        const vaccineId = searchParams.get('vaccineId');
        if (childId) {
          setAppointmentFor('child');
          handleChange('id_Nino', childId);
        }
        if (vaccineId) {
          handleChange('id_Vacuna', vaccineId);
        }
      });
    }
  }, [authLoading, user, router, fetchInitialData])

  const fetchChildSchedule = async (childId: string) => {
    if (!token || !childId) return
    setLoadingSchedule(true)
    try {
      const data = await callApi(`/api/ninos/${childId}/vaccination-schedule`, { method: "GET" })
      setSchedule(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching schedule:", error)
      setSchedule([])
    } finally {
      setLoadingSchedule(false)
    }
  }

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "id_Nino") {
      fetchChildSchedule(value)
      // Reset vaccine when child changes
      setFormData((prev) => ({ ...prev, id_Vacuna: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (appointmentFor === "self" && user?.id_Rol !== 5) {
      toast({
        variant: "destructive",
        title: "Funcionalidad no disponible",
        description: "La programación de citas para adultos está en desarrollo",
      })
      return
    }

    const appointmentData = {
      Fecha: formData.FechaCita,
      Hora: formData.HoraCita,
      id_Nino: appointmentFor === "child" && formData.id_Nino ? Number(formData.id_Nino) : null,
      id_CentroVacunacion: Number(formData.id_CentroVacunacion),
      id_Vacuna: Number(formData.id_Vacuna),
    };

    try {
      await createAppointment("/api/appointments", { method: "POST", body: appointmentData })
      toast({ title: "Cita agendada", description: "Su cita ha sido agendada correctamente" })
      router.push("/dashboard")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al agendar cita",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
      })
    }
  }

  if (authLoading || dataLoading) {
    return (
      <div className="container flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl font-bold">Cargando...</div>
          <p className="text-muted-foreground">Por favor espere</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10 px-4 md:px-0">
      <Card className="mt-3 mx-auto block max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
          <CardTitle>Agendar Nueva Cita</CardTitle>
          <CardDescription>Complete el formulario para agendar una nueva cita de vacunación</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Selector de tipo de cita removido - Solo para niños */}

            {user?.id_Rol === 5 && (
              <div className="space-y-2">
                <Label htmlFor="id_Nino">Niño</Label>
                <Select
                  onValueChange={(value) => handleChange("id_Nino", value)}
                  value={formData.id_Nino}
                  required={appointmentFor === "child"}
                  disabled={!!searchParams.get('childId')}
                >
                  <SelectTrigger className={!!searchParams.get('childId') ? "bg-muted opacity-100 cursor-not-allowed text-foreground" : ""}>
                    <SelectValue placeholder="Seleccione un niño" />
                  </SelectTrigger>
                  <SelectContent>
                    {children && children.length > 0 ? (
                      children.map((child) => (
                        <SelectItem key={child.id_Nino} value={child.id_Nino.toString()}>
                          {child.Nombres} {child.Apellidos}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-children" disabled>
                        No hay niños registrados
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="id_CentroVacunacion">Centro de Vacunación</Label>
              <Select onValueChange={(value) => handleChange("id_CentroVacunacion", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un centro" />
                </SelectTrigger>
                <SelectContent>
                  {centers?.map((center) => (
                    <SelectItem key={center.id_CentroVacunacion} value={center.id_CentroVacunacion.toString()}>
                      {center.Nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_Vacuna">Vacuna</Label>
              <Select
                onValueChange={(value) => handleChange("id_Vacuna", value)}
                value={formData.id_Vacuna}
                required
                disabled={appointmentFor === "child" && (!formData.id_Nino || loadingSchedule || !!searchParams.get('vaccineId'))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingSchedule
                      ? "Cargando esquema..."
                      : (appointmentFor === "child" && !formData.id_Nino)
                        ? "Seleccione un niño primero"
                        : "Seleccione una vacuna"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {appointmentFor === "child" && schedule.length > 0 ? (
                    schedule
                      .filter((s) => s.id_Vacuna) // Ensure valid items
                      .filter((s) => s.Estado !== 'Edad Excedida') // Filter out age exceeded
                      .filter((s) => !searchParams.get('vaccineId') || s.id_Vacuna.toString() === searchParams.get('vaccineId')) // Filter if pre-selected
                      .reduce((acc: any[], current) => {
                        if (!acc.find(item => item.id_Vacuna === current.id_Vacuna)) {
                          acc.push(current);
                        }
                        return acc;
                      }, [])
                      .map((s) => (
                        <SelectItem key={s.id_Vacuna} value={s.id_Vacuna.toString()}>
                          {s.NombreVacuna} - Dosis {s.DosisPorAplicar}
                        </SelectItem>
                      ))
                  ) : appointmentFor === "self" ? (
                    vaccines
                      ?.filter(v => !['BCG', 'Rotavirus', 'Pentavalente', 'Polio', 'SRP', 'Neumococo', 'DPT', 'Hepatitis B'].includes(v.Nombre))
                      .length > 0 ? (
                      vaccines
                        ?.filter(v => !['BCG', 'Rotavirus', 'Pentavalente', 'Polio', 'SRP', 'Neumococo', 'DPT', 'Hepatitis B'].includes(v.Nombre))
                        .map((vaccine) => (
                          <SelectItem key={vaccine.id_Vacuna} value={vaccine.id_Vacuna.toString()}>
                            {vaccine.Nombre}
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value="no-adult-vaccines" disabled>
                        No hay vacunas disponibles para adultos
                      </SelectItem>
                    )
                  ) : (
                    <SelectItem value="no-vaccines" disabled>
                      {formData.id_Nino ? "No hay vacunas pendientes para agendar" : "Seleccione un niño"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {appointmentFor === "child" && formData.id_Nino && schedule.some(s => s.Estado === 'Pendiente') && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  * Las vacunas futuras no aparecen en esta lista hasta que corresponda por edad.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="FechaCita">Fecha de la Cita</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="FechaCita"
                    type="date"
                    className="pl-10"
                    value={formData.FechaCita}
                    onChange={(e) => handleChange("FechaCita", e.target.value)}
                    min={(() => {
                      const selectedVaccine = schedule.find(s => s.id_Vacuna.toString() === formData.id_Vacuna);
                      console.log('[DEBUG] Selected Vaccine:', selectedVaccine);
                      console.log('[DEBUG] Full Schedule:', schedule);

                      if (selectedVaccine && selectedVaccine.FechaSugerida) {
                        try {
                          const suggested = new Date(selectedVaccine.FechaSugerida).toISOString().split("T")[0];
                          const today = new Date().toISOString().split("T")[0];
                          console.log('[DEBUG] Dates:', { suggested, today });
                          return suggested > today ? suggested : today;
                        } catch (e) {
                          console.log('[DEBUG] Error parsing date:', e);
                          return new Date().toISOString().split("T")[0];
                        }
                      }
                      return new Date().toISOString().split("T")[0];
                    })()}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="HoraCita">Hora de la Cita</Label>
                <Input
                  id="HoraCita"
                  type="time"
                  value={formData.HoraCita}
                  onChange={(e) => handleChange("HoraCita", e.target.value)}
                  min="07:00"
                  max="17:00"
                  required
                />
              </div>
            </div>


          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agendando cita...
                </>
              ) : (
                "Agendar Cita"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
