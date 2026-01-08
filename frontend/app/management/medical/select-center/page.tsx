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
  const [isUnauthorized, setIsUnauthorized] = useState(false) // New state to handle access denial without redirecting

  useEffect(() => {
    // Clear any stale center selection on page load to force a new choice.
    setSelectedCenter(null);
  }, [setSelectedCenter]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Checking access
    console.log("[SelectCenter] Checking access for user:", user);
    const roleId = Number(user.id_Rol);
    console.log("[SelectCenter] Role ID (cast):", roleId);

    if (roleId !== 2 && roleId !== 3) { // Medico or Enfermera
      console.log("[SelectCenter] Access Denied for role:", roleId);
      setIsUnauthorized(true); // Show error instead of redirecting (stops the loop)
      return;
    }

    const loadCenters = async () => {
      try {
        const data = await fetchCenters(`/api/users/${user.id}/centers`);
        if (data && Array.isArray(data)) {
          setCenters(data);

          // UX Improvement: If there is only one center, select it automatically to save a click.
          if (data.length === 1) {
            const singleCenter = data[0];
            console.log("[SelectCenter] Auto-selecting single center:", singleCenter.NombreCentro);

            // Short delay to allow state update and user to realize what's happening
            const centerForContext = {
              id_CentroVacunacion: singleCenter.id_CentroVacunacion,
              Nombre: singleCenter.NombreCentro,
              EsPrincipal: singleCenter.TipoAsignacion === 'Principal'
            };
            setSelectedCenter(centerForContext);
            router.push("/management/medical/appointments");
          }
        }
      } catch (error) {
        console.error("Failed to fetch medical centers:", error);
      }
    };

    loadCenters();
  }, [user, authLoading, router, fetchCenters]);

  const handleCenterSelect = (center: MedicalCenter) => {
    const centerForContext = {
      id_CentroVacunacion: center.id_CentroVacunacion,
      Nombre: center.NombreCentro,
      EsPrincipal: center.TipoAsignacion === 'Principal'
    };
    setSelectedCenter(centerForContext);
    router.push("/management/medical/appointments");
  };

  if (authLoading || centersLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // Render unauthorized state
  if (isUnauthorized) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="rounded-full bg-red-100 p-3">
          <Building className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-red-700">Acceso No Autorizado</h1>
        <p className="max-w-md text-gray-600">
          Su usuario (Rol ID: {user?.id_Rol}) no tiene permisos para acceder a la selección de centros médicos.
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Volver al Dashboard
        </Button>
        <Button variant="link" onClick={() => window.location.href = '/login'} className="text-gray-500">
          Cerrar Sesión e Intentar de Nuevo
        </Button>
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
