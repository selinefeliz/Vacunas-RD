"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import useApi from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

const lotSchema = z.object({
  id_VacunaCatalogo: z.string().min(1, "Debe seleccionar un tipo de vacuna."),
  NumeroLote: z.string().min(1, "El número de lote es obligatorio."),
  FechaRecepcion: z.string().min(1, "La fecha de recepción es obligatoria."),
  FechaCaducidad: z.string().min(1, "La fecha de caducidad es obligatoria."),
  CantidadInicial: z.coerce.number().min(1, "La cantidad debe ser al menos 1."),
})

interface VaccineType {
  id_Vacuna: number
  Nombre: string
}

interface AddLotModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  centerId: number
}

export function AddLotModal({ isOpen, onClose, onSuccess, centerId }: AddLotModalProps) {
  const [vaccineTypes, setVaccineTypes] = useState<VaccineType[]>([])
  const { request: fetchVaccineTypes, loading: loadingVaccines } = useApi<VaccineType[]>()
  const { request: submitLot, loading: submitting } = useApi()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof lotSchema>>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      id_VacunaCatalogo: "",
      NumeroLote: "",
      FechaRecepcion: "",
      FechaCaducidad: "",
      CantidadInicial: 1,
    },
  })

  useEffect(() => {
    // Cargar los tipos de vacuna cuando el modal se abre
    if (isOpen) {
      const loadVaccineTypes = async () => {
        // The useApi hook returns data directly.
        const vaccineData = await fetchVaccineTypes("/api/vaccine-catalog")
        if (vaccineData && Array.isArray(vaccineData)) {
          setVaccineTypes(vaccineData)
        }
      }
      loadVaccineTypes()
    }
  }, [isOpen, fetchVaccineTypes])

  const onSubmit = async (values: z.infer<typeof lotSchema>) => {
    const payload = {
      ...values,
      id_VacunaCatalogo: Number(values.id_VacunaCatalogo),
      id_CentroVacunacion: centerId,
    }

    const { error } = await submitLot("/api/vaccine-lots", {
      method: "POST",
      body: payload,
    })

    if (error) {
      toast({ title: "Error", description: "No se pudo registrar el lote.", variant: "destructive" })
    } else {
      toast({ title: "Éxito", description: "Lote registrado correctamente." })
      onSuccess()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Lote de Vacunas</DialogTitle>
          <DialogDescription>Complete los detalles del lote que ha llegado al centro de vacunación.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="id_VacunaCatalogo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vacuna</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una vacuna..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingVaccines ? (
                        <SelectItem value="loading" disabled>
                          Cargando...
                        </SelectItem>
                      ) : (
                        vaccineTypes.map((v) => (
                          <SelectItem key={v.id_Vacuna} value={String(v.id_Vacuna)}>
                            {v.Nombre}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="NumeroLote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Lote</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: PAA165689" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="CantidadInicial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad de Dosis Recibidas</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="FechaRecepcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Recepción</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="FechaCaducidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Caducidad</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar Lote"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
