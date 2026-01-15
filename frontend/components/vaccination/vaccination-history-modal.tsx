import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, FileText, Calendar, Syringe } from "lucide-react"

interface VaccinationHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: any
}

const mockVaccinationHistory = [
  {
    id: "1",
    vaccine: "COVID-19",
    manufacturer: "Pfizer",
    lot: "ABC123",
    dose: "1ra dosis",
    date: "2024-01-15",
    age: "34 años",
    staff: "Dr. Juan Pérez",
    center: "Centro Norte",
    nextDue: "2024-02-15",
  },
  {
    id: "2",
    vaccine: "COVID-19",
    manufacturer: "Pfizer",
    lot: "ABC124",
    dose: "2da dosis",
    date: "2024-02-15",
    age: "34 años",
    staff: "Dr. Juan Pérez",
    center: "Centro Norte",
    nextDue: null,
  },
  {
    id: "3",
    vaccine: "Influenza",
    manufacturer: "Sanofi",
    lot: "XYZ789",
    dose: "Anual",
    date: "2024-03-10",
    age: "34 años",
    staff: "Dra. Ana López",
    center: "Centro Norte",
    nextDue: "2025-03-10",
  },
]

export function VaccinationHistoryModal({ open, onOpenChange, patient }: VaccinationHistoryModalProps) {
  if (!patient) return null

  const { token } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)

  const generateDigitalCard = async () => {
    if (!patient || !token) return;

    try {
      setIsGenerating(true)
      console.log("Generating digital vaccination card for:", patient.patientName)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${apiUrl}/api/medical/patient-history-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_Nino: patient.patientId || patient.id, // Adaptation for different mock/real data structures
          id_Usuario: null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Error generating PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Historial_Vacunacion_${patient.patientName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      alert(`Error al generar el PDF: ${error.message}`);
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de Vacunación
          </DialogTitle>
          <DialogDescription>Registro completo de vacunas aplicadas a {patient.patientName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Paciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                  <p className="font-medium">{patient.patientName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cédula</p>
                  <p className="font-medium">{patient.patientCedula}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Edad Actual</p>
                  <p className="font-medium">{patient.ageAtApplication}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Centro Asignado</p>
                  <p className="font-medium">{patient.center}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vaccination History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Syringe className="h-5 w-5" />
                    Historial de Vacunación
                  </CardTitle>
                  <CardDescription>Registro cronológico de todas las vacunas aplicadas</CardDescription>
                </div>
                <Button onClick={generateDigitalCard} disabled={isGenerating}>
                  {isGenerating ? (
                    <>Generando...</>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Carné Digital (PDF)
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockVaccinationHistory.map((vaccination, index) => (
                  <div key={vaccination.id}>
                    <div className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{vaccination.vaccine}</h4>
                          <Badge variant="outline">{vaccination.dose}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Fabricante:</span>
                            <span className="ml-2 font-medium">{vaccination.manufacturer}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Lote:</span>
                            <span className="ml-2 font-medium">{vaccination.lot}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fecha:</span>
                            <span className="ml-2 font-medium">{new Date(vaccination.date).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Edad:</span>
                            <span className="ml-2 font-medium">{vaccination.age}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Personal:</span>
                            <span className="ml-2 font-medium">{vaccination.staff}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Centro:</span>
                            <span className="ml-2 font-medium">{vaccination.center}</span>
                          </div>
                        </div>

                        {vaccination.nextDue && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                            <Calendar className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800">
                              Próxima dosis: {new Date(vaccination.nextDue).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {index < mockVaccinationHistory.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vaccination Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Esquema de Vacunación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <div className="text-sm text-green-800">Vacunas Completas</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">1</div>
                  <div className="text-sm text-yellow-800">Próximas Dosis</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">95%</div>
                  <div className="text-sm text-blue-800">Esquema Completo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
