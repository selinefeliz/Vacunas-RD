"use client"

import { useState, useEffect, useCallback } from "react"
import useApi from "@/hooks/use-api"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { AddLotModal } from "@/components/inventory/add-lot-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VaccineCatalogManagement } from "./vaccine-catalog-management"

// Debug: Add browser console logging
const DEBUG = true
function log(...args: any[]) {
  if (DEBUG) console.log("[Inventory]", ...args)
}

interface Lot {
  id_LoteVacuna: number
  NumeroLote: string
  NombreVacuna: string
  NombreFabricante: string
  FechaCaducidad: string
  FechaRecepcion: string
  CantidadInicial: number
  CantidadDisponible: number
  Activo: boolean
}

export function InventoryTabContent() {
  const { user, loading: authLoading } = useAuth() // Get authLoading
  log("User from auth context:", user, "Auth Loading:", authLoading)

  const [lots, setLots] = useState<Lot[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // Local loading state

  const { request: fetchLotsApi, loading: apiLoadingLots, error: apiError } = useApi<Lot[]>() // Rename and get error

  const centerId = user?.id_CentroVacunacion
  log("Centro ID from user object:", centerId)

  const loadLots = useCallback(async () => {
    log("loadLots called. CenterId:", centerId, "AuthLoading:", authLoading)
    if (!centerId) {
      log("No centerId available in loadLots, setting empty and returning.")
      setLots([])
      setIsLoading(false)
      return
    }
    // authLoading check is implicitly handled by useApi's request function (fetchLotsApi)
    // If authLoading is true when fetchLotsApi is called, it will return undefined.

    setIsLoading(true)
    try {
      log(`Making API request to /api/vaccine-lots/center/${centerId}`)
      const dataFromApi = await fetchLotsApi(`/api/vaccine-lots/center/${centerId}`)

      log("API request. Data received from fetchLotsApi:", dataFromApi, "API Error:", apiError)
      if (dataFromApi && Array.isArray(dataFromApi)) {
        log(`Setting ${dataFromApi.length} lots to state`)
        setLots(dataFromApi)
      } else {
        log(
          "No data (or non-array data) received from fetchLotsApi, or API error. Setting empty array. Data:",
          dataFromApi,
          "Error:",
          apiError,
        )
        setLots([])
      }
    } catch (err: any) {
      // This catch block might not be hit if useApi handles the error and returns undefined/null for data.
      // The apiError from useApi should be checked.
      log("Exception during fetchLotsApi call in loadLots:", err.message)
      setLots([])
    } finally {
      setIsLoading(false)
    }
  }, [centerId, fetchLotsApi, authLoading, apiError]) // Added dependencies

  useEffect(() => {
    log("useEffect triggered. CenterId:", centerId, "AuthLoading:", authLoading)
    if (centerId && !authLoading) {
      log("CenterId available and auth not loading. Calling loadLots.")
      loadLots()
    } else if (authLoading) {
      log("Auth is loading, deferring loadLots call. Setting isLoading to true.")
      setIsLoading(true) // Keep UI in loading state while auth loads
    } else if (!centerId && !authLoading) {
      log("No centerId available and auth finished loading. Setting lots to empty and stopping load indicator.")
      setLots([])
      setIsLoading(false) // Stop loading if no centerId and auth is done
    }
  }, [centerId, authLoading, loadLots]) // loadLots is now a useCallback dependency

  const handleSuccess = () => {
    // Recargar lotes después de añadir uno nuevo
    loadLots()
  }

  // Instead of blocking rendering, we'll show a message inside the tabs if needed
  log(
    "Rendering component. Lots:",
    lots.length,
    "Local isLoading:",
    isLoading,
    "API LoadingLots:",
    apiLoadingLots,
    "API Error:",
    apiError,
  )

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <Tabs defaultValue="lotManagement" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="lotManagement">Gestión de Lotes</TabsTrigger>
          <TabsTrigger value="vaccineCatalog">Catálogo de Vacunas</TabsTrigger>
        </TabsList>
        <TabsContent value="lotManagement">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Lotes del Centro</h2>
            <Button onClick={() => setIsModalOpen(true)} disabled={!centerId}>
              Añadir Nuevo Lote
            </Button>
          </div>

          {!centerId ? (
            <div className="p-4 text-center border rounded-md">
              <p className="text-amber-600">No se pudo identificar un centro de vacunación asociado a tu cuenta.</p>
              <p className="mt-2">Por favor, contacta al administrador para asignar un centro.</p>
            </div>
          ) : (
            <div>
              {/* Force table to render regardless of loadingLots state */}
              <InventoryTable lots={lots} loading={isLoading} />
              {lots.length === 0 && !isLoading && (
                <div className="mt-4 p-2 text-center">
                  <p className="text-sm text-gray-500">
                    Consejo: Si acabas de iniciar sesión y no ves los lotes esperados, intenta cerrar sesión y volver a
                    entrar.
                  </p>
                </div>
              )}
            </div>
          )}

          <AddLotModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleSuccess}
            centerId={centerId || 0}
          />
        </TabsContent>
        <TabsContent value="vaccineCatalog">
          <VaccineCatalogManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
