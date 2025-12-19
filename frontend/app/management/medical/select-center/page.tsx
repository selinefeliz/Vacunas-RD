"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import useApi from "@/hooks/use-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Building } from "lucide-react"

interface MedicalCenter {
  id_CentroVacunacion: number
  NombreCentro: string
  TipoAsignacion: string
}

export default function SelectCenterPage() {
  const { user, setSelectedCenter, selectedCenter, loading: authLoading } = useAuth()
  const router = useRouter()
  const { request: fetchCenters, loading: centersLoading } = useApi<MedicalCenter[]>()
  const [centers, setCenters] = useState<MedicalCenter[]>([])

  useEffect(() => {
    // Clear any stale center selection on page load to force a new choice.
    // This prevents automatic redirection from a previous session's state.
    setSelectedCenter(null);
  }, [setSelectedCenter]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.id_Rol !== 2) { // Medico
      router.push("/dashboard");
      return;
    }

    const loadCenters = async () => {
      try {
        const data = await fetchCenters(`/api/users/${user.id}/centers`);
        if (data) {
          setCenters(data);
        }
      } catch (error) {
        console.error("Failed to fetch medical centers:", error);
      }
    };

    loadCenters();
  }, [user, authLoading, router, fetchCenters]);

  const handleCenterSelect = (center: MedicalCenter) => {
    // Map backend structure to the structure expected by AuthContext
    const centerForContext = {
      id_CentroVacunacion: center.id_CentroVacunacion,
      Nombre: center.NombreCentro,
      EsPrincipal: center.TipoAsignacion === 'Principal'
    };
    setSelectedCenter(centerForContext);
    router.push("/management/medical/appointments");
  };

  // Show a loader while auth is loading or centers are loading
  if (authLoading || centersLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Seleccione un Centro de Trabajo</CardTitle>
            <CardDescription>Elija el centro de vacunación en el que atenderá hoy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {centers.map((center) => (
              <Button
                key={center.id_CentroVacunacion}
                variant={center.TipoAsignacion === 'Principal' ? "default" : "outline"}
                className="w-full justify-start p-6 text-lg"
                onClick={() => handleCenterSelect(center)}
              >
                <Building className="mr-4 h-6 w-6" />
                <div className="text-left">
                  <div>{center.NombreCentro}</div>
                  {center.TipoAsignacion === 'Principal' && <div className="text-xs font-light">(Principal)</div>}
                </div>
              </Button>
            ))}
            {centers.length === 0 && !centersLoading && (
              <p className="text-center text-muted-foreground">No tiene centros asignados.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
