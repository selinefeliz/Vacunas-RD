"use client"

import type React from "react"

import { useState, useEffect, type FormEvent } from "react"
import useApi from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Manufacturer {
  id_Fabricante: number
  Fabricante: string
}

interface VaccineCatalogEntry {
  id_Vacuna: number
  Nombre: string
  DosisLimite?: number | null
  Tipo?: string | null
  Descripcion?: string | null
  id_Fabricante: number
  NombreFabricante?: string
}

interface FormData {
  id_Fabricante: string
  Nombre: string
  DosisLimite: string
  Tipo: string
  Descripcion: string
}

export function VaccineCatalogManagement() {
  const { toast } = useToast()
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [vaccineCatalog, setVaccineCatalog] = useState<VaccineCatalogEntry[]>([])
  const [formData, setFormData] = useState<FormData>({
    id_Fabricante: "",
    Nombre: "",
    DosisLimite: "",
    Tipo: "",
    Descripcion: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  // API hooks
  const { request: fetchManufacturers } = useApi<Manufacturer[]>()
  const { request: fetchVaccineCatalog } = useApi<VaccineCatalogEntry[]>()
  const { request: addVaccineRequest, loading: addingVaccine } = useApi<VaccineCatalogEntry>()

  // Load manufacturers and vaccine catalog data
  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      // Load manufacturers
      console.log("[DEBUG] Fetching manufacturers...")
      const manufacturersData = await fetchManufacturers("/api/manufacturers")
      console.log("[DEBUG] Manufacturers API Response Data:", manufacturersData)
      if (manufacturersData && Array.isArray(manufacturersData)) {
        setManufacturers(manufacturersData)
      } else {
        console.warn("[DEBUG] No manufacturers data received or data is not an array.")
        setManufacturers([]) // Ensure it's an empty array for safety
      }

      // Load vaccine catalog
      const catalogData = await fetchVaccineCatalog("/api/vaccine-catalog")
      console.log("[DEBUG] Vaccine Catalog API Response Data:", catalogData)
      if (catalogData && Array.isArray(catalogData)) {
        setVaccineCatalog(catalogData)
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos. Por favor, inténtelo de nuevo.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    console.log("[DEBUG] Manufacturers state updated:", manufacturers)
  }, [manufacturers])

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, id_Fabricante: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.id_Fabricante || !formData.Nombre) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Fabricante y Nombre son campos requeridos.",
      })
      return
    }

    // Prepare payload
    const payload = {
      id_Fabricante: Number.parseInt(formData.id_Fabricante, 10),
      Nombre: formData.Nombre,
      DosisLimite: formData.DosisLimite ? Number.parseInt(formData.DosisLimite, 10) : null,
      Tipo: formData.Tipo || null,
      Descripcion: formData.Descripcion || null,
    }

    try {
      // Submit new vaccine
      const responseData = await addVaccineRequest("/api/vaccine-catalog", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      })

      // The useApi hook returns data directly on success, or throws an error on failure.
      if (responseData && responseData.vaccine) {
        console.log("[DEBUG] Success: Vaccine added. Calling toast notification.")
        toast({ title: "Éxito", description: "Vacuna añadida al catálogo correctamente." })

        // Reset form
        setFormData({
          id_Fabricante: "",
          Nombre: "",
          DosisLimite: "",
          Tipo: "",
          Descripcion: "",
        })

        // Update state directly for a faster UI response.
        const newVaccine = responseData.vaccine

        // Find the manufacturer's name to display in the table
        const manufacturerName =
          manufacturers.find((m) => m.id_Fabricante === newVaccine.id_Fabricante)?.Fabricante || "N/A"

        const newCatalogEntry: VaccineCatalogEntry = {
          ...newVaccine,
          NombreFabricante: manufacturerName,
        }

        setVaccineCatalog((prevCatalog) => [...prevCatalog, newCatalogEntry])
      } else {
        // This block can be a fallback, but the catch block is the primary error handler.
        console.log("[DEBUG] Fallback error: Response was not as expected.", responseData)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo añadir la vacuna. Respuesta inesperada.",
        })
      }
    } catch (error) {
      console.error("Error adding vaccine:", error)
      console.log("[DEBUG] Catch block: An error was thrown during vaccine addition.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un problema al añadir la vacuna. Por favor, inténtelo de nuevo.",
      })
    }
  }

  if (isLoading) {
    return <p>Cargando catálogo de vacunas y fabricantes...</p>
  }

  return (
    <div className="space-y-8">
      {/* Sección para añadir nueva vacuna */}
      <Card>
        <CardHeader>
          <CardTitle>Añadir Nueva Vacuna al Catálogo</CardTitle>
          <CardDescription>Complete el formulario para registrar una nueva vacuna en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="addVaccineForm" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="Nombre">
                  Nombre de la Vacuna <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="Nombre"
                  name="Nombre"
                  placeholder="Ej: COVID-19 mRNA"
                  value={formData.Nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_Fabricante">
                  Fabricante <span className="text-red-500">*</span>
                </Label>
                <Select name="id_Fabricante" onValueChange={handleSelectChange} value={formData.id_Fabricante} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un fabricante" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map((m) => (
                      <SelectItem key={m.id_Fabricante} value={String(m.id_Fabricante)}>
                        {m.Fabricante}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="DosisLimite">Dosis Límite</Label>
                <Input
                  id="DosisLimite"
                  name="DosisLimite"
                  type="number"
                  placeholder="Ej: 2"
                  value={formData.DosisLimite}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="Tipo">Tipo</Label>
                <Input
                  id="Tipo"
                  name="Tipo"
                  placeholder="Ej: ARNm, Vector Viral"
                  value={formData.Tipo}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="Descripcion">Descripción</Label>
              <Textarea
                id="Descripcion"
                name="Descripcion"
                placeholder="Detalles adicionales sobre la vacuna..."
                value={formData.Descripcion}
                onChange={handleInputChange}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" form="addVaccineForm" disabled={addingVaccine} className="w-full md:w-auto">
            {addingVaccine ? "Añadiendo..." : "Añadir Vacuna al Catálogo"}
          </Button>
        </CardFooter>
      </Card>

      {/* Sección para mostrar catálogo existente */}
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Vacunas</CardTitle>
          <CardDescription>Listado de todas las vacunas disponibles en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {vaccineCatalog.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No hay vacunas registradas en el catálogo.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>Dosis Límite</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccineCatalog.map((vaccine) => (
                    <TableRow key={vaccine.id_Vacuna}>
                      <TableCell>{vaccine.Nombre}</TableCell>
                      <TableCell>
                        {vaccine.NombreFabricante ||
                          manufacturers.find((m) => m.id_Fabricante === vaccine.id_Fabricante)?.Fabricante ||
                          "N/A"}
                      </TableCell>
                      <TableCell>{vaccine.DosisLimite ?? "N/A"}</TableCell>
                      <TableCell>{vaccine.Tipo ?? "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate" title={vaccine.Descripcion || ""}>
                        {vaccine.Descripcion ?? "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
