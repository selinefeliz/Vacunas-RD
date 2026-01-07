"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import useApi from "@/hooks/use-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Package, Users, Activity, Plus, FileText, CheckCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDisplayDate, formatTimeString } from "@/utils/format-time"

export default function CenterStaffDashboard() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const { request: apiRequest } = useApi()

    const [activeTab, setActiveTab] = useState("overview")
    const [appointments, setAppointments] = useState<any[]>([])
    const [lots, setLots] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState({
        todayAppointments: 0,
        confirmedAppointments: 0,
        lowStockLots: 0
    })

    // Inventory Form State
    const [isAddLotOpen, setIsAddLotOpen] = useState(false)
    const [vaccines, setVaccines] = useState<any[]>([])
    const [newLot, setNewLot] = useState({
        id_VacunaCatalogo: "",
        NumeroLote: "",
        FechaCaducidad: "",
        CantidadInicial: ""
    })

    const fetchDashboardData = useCallback(async () => {
        if (!user || user.id_Rol !== 6 || !user.id_CentroVacunacion) return

        setLoading(true)
        try {
            // Fetch Appointments
            const appts = await apiRequest(`/api/appointments`)
            setAppointments(appts || [])

            // Fetch Inventory
            const inventory = await apiRequest(`/api/inventory/lots/center/${user.id_CentroVacunacion}`)
            setLots(inventory || [])

            // Calc Stats
            const todayStr = new Date().toISOString().split('T')[0]
            const todayAppts = (appts || []).filter((a: any) => a.Fecha && a.Fecha.startsWith(todayStr))
            const lowStock = (inventory || []).filter((l: any) => l.CantidadDisponible < 20).length // Threshold 20

            setStats({
                todayAppointments: todayAppts.length,
                confirmedAppointments: (appts || []).filter((a: any) => a.EstadoCita === 'Confirmada').length,
                lowStockLots: lowStock
            })

        } catch (error) {
            console.error("Error fetching dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }, [user, apiRequest])

    const fetchVaccines = useCallback(async () => {
        try {
            const data = await apiRequest('/api/vaccine-catalog')
            setVaccines(data || [])
        } catch (e) {
            console.error("Failed to load vaccines", e)
        }
    }, [apiRequest])

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.id_Rol !== 6) {
                router.push("/dashboard") // Redirect back if not staff
            } else {
                fetchDashboardData()
                fetchVaccines()
            }
        }
    }, [user, authLoading, router, fetchDashboardData, fetchVaccines])


    const handleAddLot = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id_CentroVacunacion) return

        try {
            await apiRequest('/api/inventory/lots', {
                method: 'POST',
                body: {
                    ...newLot,
                    id_CentroVacunacion: user.id_CentroVacunacion,
                    CantidadInicial: parseInt(newLot.CantidadInicial),
                    id_VacunaCatalogo: parseInt(newLot.id_VacunaCatalogo)
                }
            })
            setIsAddLotOpen(false)
            fetchDashboardData() // Refresh
            setNewLot({
                id_VacunaCatalogo: "",
                NumeroLote: "",
                FechaCaducidad: "",
                CantidadInicial: ""
            })
        } catch (err) {
            console.error("Failed to add lot", err)
            alert("Error al registrar el lote. Verifique los datos.")
        }
    }

    if (authLoading || !user) {
        return <div className="p-8">Cargando...</div>
    }

    const todayStr = new Date().toISOString().split('T')[0]
    const todaysAppointments = appointments.filter((a: any) => a.Fecha && a.Fecha.startsWith(todayStr))

    return (
        <div className="container py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Panel del Centro de Vacunación</h1>
                    <p className="text-muted-foreground">
                        Bienvenido, {(user as any).nombre || user.email}.
                        {/* We assume user object has enriched info or we might need to fetch center name separately */}
                        Centro ID: {user.id_CentroVacunacion}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Personal de Centro
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="appointments">Logística de Citas</TabsTrigger>
                    <TabsTrigger value="inventory">Gestión de Inventario</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                                <p className="text-xs text-muted-foreground">Pacientes esperados hoy</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.confirmedAppointments}</div>
                                <p className="text-xs text-muted-foreground">Total citas confirmadas próximas</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Alertas Stock</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">{stats.lowStockLots}</div>
                                <p className="text-xs text-muted-foreground">Lotes con bajo inventario</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Próximas Citas (Hoy)</CardTitle>
                                <CardDescription>Pacientes programados para hoy</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {todaysAppointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {todaysAppointments.slice(0, 5).map((appt: any) => (
                                            <div key={appt.id_Cita} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-medium">{appt.NombrePaciente}</p>
                                                    <p className="text-sm text-muted-foreground">{appt.NombreVacuna}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant={appt.EstadoCita === 'Confirmada' ? 'default' : 'secondary'}>
                                                        {formatTimeString(appt.Hora)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No hay citas para hoy.</p>
                                )}
                                <Button variant="link" className="px-0 mt-4" onClick={() => setActiveTab('appointments')}>
                                    Ver agenda completa
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Estado de Inventario</CardTitle>
                                <CardDescription>Resumen de vacunas disponibles</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {lots.slice(0, 5).map((lot: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between mb-4 last:mb-0">
                                        <div>
                                            <p className="font-medium">{lot.NombreVacuna}</p>
                                            <p className="text-xs text-muted-foreground">Lote: {lot.NumeroLote}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`font-bold ${lot.CantidadDisponible < 20 ? 'text-red-600' : 'text-green-600'}`}>
                                                {lot.CantidadDisponible}
                                            </span>
                                            <p className="text-xs text-muted-foreground">dosis</p>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="link" className="px-0 mt-4" onClick={() => setActiveTab('inventory')}>
                                    Gestionar Inventario
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Appointments Tab */}
                <TabsContent value="appointments" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Agenda del Centro</CardTitle>
                                    <CardDescription>Gestione el flujo de pacientes</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                                        <Activity className="mr-2 h-4 w-4" /> Actualizar
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <div className="grid grid-cols-6 border-b bg-muted p-4 font-medium text-sm">
                                    <div className="col-span-1">Hora</div>
                                    <div className="col-span-2">Paciente</div>
                                    <div className="col-span-1">Vacuna</div>
                                    <div className="col-span-1">Estado</div>
                                    <div className="col-span-1 text-right">Acciones</div>
                                </div>
                                <div className="divide-y">
                                    {appointments.length > 0 ? appointments.map((appt: any) => (
                                        <div key={appt.id_Cita} className="grid grid-cols-6 p-4 items-center text-sm">
                                            <div className="font-medium">
                                                {formatDisplayDate(new Date(appt.Fecha))} <br />
                                                <span className="text-xs text-muted-foreground">{formatTimeString(appt.Hora)}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="font-medium">{appt.NombrePaciente}</div>
                                                {appt.RequiereTutor && <Badge variant="secondary" className="text-[10px] h-4 px-1">Menor</Badge>}
                                            </div>
                                            <div>{appt.NombreVacuna}</div>
                                            <div>
                                                <Badge variant={
                                                    appt.EstadoCita === 'Confirmada' ? 'default' :
                                                        appt.EstadoCita === 'Asistida' ? 'secondary' : 'outline'
                                                }>
                                                    {appt.EstadoCita}
                                                </Badge>
                                            </div>
                                            <div className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/appointments/${appt.id_Cita}`)}>
                                                    Ver Detalles
                                                </Button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No se encontraron citas.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Inventory Tab */}
                <TabsContent value="inventory" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold tracking-tight">Inventario de Vacunas</h2>
                        <Dialog open={isAddLotOpen} onOpenChange={setIsAddLotOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> Registrar Lote
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Registrar Nuevo Lote</DialogTitle>
                                    <DialogDescription>
                                        Ingrese los detalles del nuevo lote de vacunas recibido.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddLot} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="vacuna">Vacuna</Label>
                                        <Select
                                            value={newLot.id_VacunaCatalogo}
                                            onValueChange={(val) => setNewLot({ ...newLot, id_VacunaCatalogo: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar vacuna" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vaccines.map((v: any) => (
                                                    <SelectItem key={v.id_Vacuna} value={v.id_Vacuna.toString()}>
                                                        {v.Nombre} ({v.Tipo})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="lote">Número de Lote</Label>
                                        <Input
                                            id="lote"
                                            value={newLot.NumeroLote}
                                            onChange={(e) => setNewLot({ ...newLot, NumeroLote: e.target.value })}
                                            placeholder="Ej. AB-12345"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="cantidad">Cantidad Inicial</Label>
                                            <Input
                                                id="cantidad"
                                                type="number"
                                                value={newLot.CantidadInicial}
                                                onChange={(e) => setNewLot({ ...newLot, CantidadInicial: e.target.value })}
                                                required
                                                min="1"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="caducidad">Fecha Caducidad</Label>
                                            <Input
                                                id="caducidad"
                                                type="date"
                                                value={newLot.FechaCaducidad}
                                                onChange={(e) => setNewLot({ ...newLot, FechaCaducidad: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button type="submit">Guardar Lote</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Lotes Disponibles</CardTitle>
                            <CardDescription>Gestión de stock actual del centro</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <div className="grid grid-cols-6 border-b bg-muted p-4 font-medium text-sm">
                                    <div className="col-span-2">Vacuna</div>
                                    <div>Lote</div>
                                    <div>Caducidad</div>
                                    <div className="text-right">Inicial</div>
                                    <div className="text-right">Disponible</div>
                                </div>
                                <div className="divide-y">
                                    {lots.length > 0 ? lots.map((lot: any) => (
                                        <div key={lot.id_LoteVacuna} className="grid grid-cols-6 p-4 items-center text-sm">
                                            <div className="col-span-2 font-medium">
                                                {lot.NombreVacuna}
                                                <div className="text-xs text-muted-foreground">{lot.Fabricante}</div>
                                            </div>
                                            <div>{lot.NumeroLote}</div>
                                            <div className={new Date(lot.FechaCaducidad) < new Date() ? "text-red-500 font-bold" : ""}>
                                                {formatDisplayDate(new Date(lot.FechaCaducidad))}
                                            </div>
                                            <div className="text-right text-muted-foreground">{lot.CantidadInicial}</div>
                                            <div className="text-right font-bold">
                                                <Badge variant={lot.CantidadDisponible < 20 ? "destructive" : "outline"}>
                                                    {lot.CantidadDisponible}
                                                </Badge>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No hay lotes registrados en este centro.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
