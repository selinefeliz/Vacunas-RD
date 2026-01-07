"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import useApi from "@/hooks/use-api"
import { useToast } from "@/components/ui/use-toast"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Calendar, FileText } from "lucide-react"

const historySchema = z.object({
  fechaNacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  alergias: z.string().optional(),
  notasAdicionales: z.string().optional(),
})

interface PatientHistoryFormProps {
  patientId: number
  childId?: number
  patientName: string
  onSuccess: () => void
}

export function PatientHistoryForm({ patientId, childId, patientName, onSuccess }: PatientHistoryFormProps) {
  const { toast } = useToast()
  const { request: createHistory, loading } = useApi()

  const form = useForm<z.infer<typeof historySchema>>({
    resolver: zodResolver(historySchema),
    defaultValues: {
      fechaNacimiento: "",
      alergias: "",
      notasAdicionales: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof historySchema>) => {
    try {
      const payload = {
        id_Usuario: patientId,
        id_Nino: childId || null,
        fechaNacimiento: values.fechaNacimiento,
        alergias: values.alergias || "",
        notasAdicionales: values.notasAdicionales || "",
      }

      await createHistory("/api/medical/create-patient-history", {
        method: "POST",
        body: payload,
      })

      toast({
        title: "Historial Creado",
        description: "El historial médico ha sido registrado exitosamente",
      })

      onSuccess()
    } catch (error) {
      console.error("Error creating patient history:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el historial médico",
      })
    }
  }

  // Calculate max birth date (today)
  const getMaxBirthDate = () => {
    return new Date().toISOString().split("T")[0]
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <User className="h-5 w-5" />
          Crear Historial Médico
        </CardTitle>
        <CardDescription className="text-orange-700">
          <strong>{patientName}</strong> no tiene un historial médico registrado. Es obligatorio crear uno antes de
          proceder con la atención.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fechaNacimiento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de Nacimiento *
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} max={getMaxBirthDate()} className="bg-white" />
                  </FormControl>
                  <p className="text-xs text-gray-600">
                    Esta información es obligatoria y será visible en todos los centros de vacunación
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alergias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alergias Conocidas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Registre cualquier alergia conocida del paciente..."
                      {...field}
                      className="bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notasAdicionales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notas Médicas Adicionales
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Condiciones médicas, medicamentos, observaciones importantes..."
                      {...field}
                      className="bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando Historial...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Crear Historial Médico
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
