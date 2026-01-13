"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Download } from "lucide-react"
import useApi from "@/hooks/use-api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AuditLog {
  id_Auditoria: number
  Fecha: string
  Usuario: string
  Accion: string
  Recurso: string
  id_Recurso: string
  Detalles: string
  DireccionIP: string
}

export default function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAction, setSelectedAction] = useState("all")

  const { data: logs, loading, error, request: fetchLogs } = useApi<AuditLog[]>()

  useEffect(() => {
    fetchLogs("/api/audit-log")
  }, [fetchLogs])

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      (log.Usuario?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (log.Detalles?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (log.Recurso?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesAction = selectedAction === "all" || log.Accion === selectedAction

    return matchesSearch && matchesAction
  }) || []

  // Sort by date desc (if not already from backend)
  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime())

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Administración", href: "/admin" },
    { label: "Historial de Auditoría" },
  ]

  const exportLogs = () => {
    const headers = ["Fecha", "Usuario", "Accion", "Recurso", "Detalles", "IP"]
    const csvContent = [
      headers.join(","),
      ...sortedLogs.map(log =>
        [`"${new Date(log.Fecha).toLocaleString()}"`, `"${log.Usuario}"`, `"${log.Accion}"`, `"${log.Recurso}"`, `"${log.Detalles}"`, `"${log.DireccionIP}"`].join(",")
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", "audit_logs.csv")
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit log</h1>
          <p className="text-muted-foreground">Monitoreo de actividad de usuarios y eventos del sistema.</p>
        </div>
        <Button onClick={exportLogs} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-white text-black"
          />
        </div>

        <Select value={selectedAction} onValueChange={setSelectedAction}>
          <SelectTrigger className="w-[180px] bg-white text-black">
            <SelectValue placeholder="Tipo de Evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los eventos</SelectItem>
            <SelectItem value="CREATE">Creación</SelectItem>
            <SelectItem value="UPDATE">Actualización</SelectItem>
            <SelectItem value="DELETE">Eliminación</SelectItem>
            <SelectItem value="VIEW">Visualización</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audit Log Table */}
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-[300px]">Usuario</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">Cargando historial...</TableCell>
                  </TableRow>
                )}

                {error && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-red-500">Error: {error}</TableCell>
                  </TableRow>
                )}

                {!loading && sortedLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No se encontraron registros.</TableCell>
                  </TableRow>
                )}

                {!loading && sortedLogs.map((log) => (
                  <TableRow key={log.id_Auditoria} className="group hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.Usuario)}&background=random`} />
                          <AvatarFallback>{log.Usuario ? log.Usuario.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{log.Usuario || 'Desconocido'}</span>
                          <span className="text-xs text-muted-foreground">{log.DireccionIP}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={
                            log.Accion === 'DELETE' ? 'text-red-600 font-medium' :
                              log.Accion === 'UPDATE' ? 'text-blue-600 font-medium' :
                                log.Accion === 'CREATE' ? 'text-green-600 font-medium' :
                                  'text-gray-700 font-medium'
                          }>
                            {log.Accion}
                          </span>
                          <span className="text-sm text-gray-600 font-medium">{log.Recurso}</span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate max-w-[400px]" title={log.Detalles}>
                          {log.Detalles}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-500">
                      {new Date(log.Fecha).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
