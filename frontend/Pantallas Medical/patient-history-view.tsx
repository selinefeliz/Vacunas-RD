"use client"

import { useState, useEffect } from "react"
import useApi from "@/hooks/use-api"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Calendar, Syringe, MapPin, Clock } from "lucide-react"

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
  id_HistoricoCita: number
  Vacuna: string
  NombreCompletoPersonal: string
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
}

export function PatientHistoryView({ patientId, childId, showVaccinesOnly = false }: PatientHistoryViewProps) {
  const { toast } = useToast()
  const { request: fetchHistory, loading } = useApi()

  const [patientHistory, setPatientHistory] = useState<PatientHistory | null>(null)
  const [vaccinationRecords, setVaccinationRecords] = useState<VaccinationRecord[]>([])

  useEffect(() => {
    loadPatientHistory()
  }, [patientId, childId])

  const loadPatientHistory = async () => {
    try {
      const data = await fetchHistory("/api/medical/patient-full-history", {
        method: "POST",
        body: {
          id_Usuario: patientId,
          id_Nino: childId || null,
        },
      })

      if (data && data.length > 0) {
        // First recordset contains patient basic info
        setPatientHistory(data[0][0])
        // Second recordset contains vaccination records
        setVaccinationRecords(data[1] || [])
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

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!patientHistory && !showVaccinesOnly) {
    return (
      <Card className="border-gray-200">
        <CardContent className="text-center py-8">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-gray-500">No se encontró historial médico para este paciente</p>
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
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Paciente
            </CardTitle>
            <CardDescription>Datos básicos del historial médico</CardDescription>
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
                    {new Date(patientHistory.FechaNacimiento).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Edad Actual:</span>
                  <Badge variant="outline">{patientHistory.EdadActual} años</Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Alergias:</span>
                  <p className="text-sm bg-red-50 p-2 rounded border">
                    {patientHistory.Alergias || "No se han registrado alergias"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Notas Médicas:</span>
                  <p className="text-sm bg-blue-50 p-2 rounded border">
                    {patientHistory.NotasAdicionales || "No hay notas adicionales"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vaccination History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            Historial de Vacunación
          </CardTitle>
          <CardDescription>
            Registro completo de vacunas aplicadas ({vaccinationRecords.length} registros)
          </CardDescription>
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
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccinationRecords.map((record) => (
                    <TableRow key={record.id_HistoricoCita}>
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
                            {new Date(record.FechaAplicacion).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {record.HoraAplicacion}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-sm">{record.CentroMedico}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{record.NombreCompletoPersonal}</TableCell>
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
    </div>
  )
}
