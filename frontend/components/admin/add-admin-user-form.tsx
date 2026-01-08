"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import useApi from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, PlusCircle, XCircle } from "lucide-react"

const formSchema = z
  .object({
    Cedula_Usuario: z.string().min(1, "Cédula es requerida"),
    Nombre: z.string().min(1, "Nombre es requerido"),
    Apellido: z.string().min(1, "Apellido es requerido"),
    Email: z.string().email("Debe ser un email válido"),
    Clave: z.string().min(6, "La clave debe tener al menos 6 caracteres"),
    id_Rol: z.string().min(1, "El rol es requerido"),
    id_CentroVacunacion: z.string().optional(),
    additionalCenters: z.array(z.object({ id: z.string().min(1, "Debe seleccionar un centro") })).optional(),
  })
  .refine(
    (data) => {
      if (data.id_Rol === "2" || data.id_Rol === "6" || data.id_Rol === "3") {
        return !!data.id_CentroVacunacion && data.id_CentroVacunacion.length > 0
      }
      return true
    },
    {
      message: "Centro de vacunación principal es requerido para este rol",
      path: ["id_CentroVacunacion"],
    },
  )
  .refine(
    (data) => {
      const allCenters = [
        data.id_CentroVacunacion,
        ...(data.additionalCenters?.map((c) => c.id) || []),
      ].filter(Boolean)
      const uniqueCenters = new Set(allCenters)
      return allCenters.length === uniqueCenters.size
    },
    {
      message: "No puede seleccionar el mismo centro varias veces.",
      path: ["additionalCenters"],
    },
  )

interface Role {
  id_Rol: number
  Rol: string
}

interface VaccinationCenter {
  id_CentroVacunacion: number
  Nombre: string
}

export function AddAdminUserForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast()
  const { request: createUser, loading: isCreating } = useApi()

  const [roles, setRoles] = useState<Role[]>([])
  const [centers, setCenters] = useState<VaccinationCenter[]>([])

  const { request: fetchRoles, loading: loadingRoles } = useApi<Role[]>()
  const { request: fetchCenters, loading: loadingCenters } = useApi<VaccinationCenter[]>()

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const rolesData = await fetchRoles("/api/roles")
        if (rolesData) setRoles(rolesData)
      } catch (error) {
        console.error("Failed to fetch roles:", error)
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los roles." })
      }
      try {
        const centersData = await fetchCenters("/api/vaccination-centers")
        if (centersData) setCenters(centersData)
      } catch (error) {
        console.error("Failed to fetch centers:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los centros de vacunación.",
        })
      }
    }

    loadInitialData()
  }, [fetchRoles, fetchCenters, toast])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Cedula_Usuario: "",
      Nombre: "",
      Apellido: "",
      Email: "",
      Clave: "",
      id_Rol: "",
      id_CentroVacunacion: "",
      additionalCenters: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalCenters",
  })

  const selectedRole = form.watch("id_Rol")

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const payload = {
      ...values,
      id_CentroVacunacion: selectedRole === "2" || selectedRole === "6" || selectedRole === "3" ? values.id_CentroVacunacion : null,
      additionalCenters: selectedRole === "2" ? values.additionalCenters?.map((c) => c.id) : [],
    }

    try {
      await createUser("/api/users/admin-create", {
        method: "POST",
        body: payload,
      })
      toast({
        title: "Éxito",
        description: "Usuario creado correctamente.",
      })
      form.reset()
      onSuccess()
    } catch (error: any) {
      if (error.response && error.response.status === 409 && error.response.data) {
        const { message, field } = error.response.data
        if (field && (field === "Email" || field === "Cedula_Usuario")) {
          form.setError(field as "Email" | "Cedula_Usuario", {
            type: "manual",
            message: message || "Este valor ya está en uso.",
          })
        } else {
          toast({
            variant: "destructive",
            title: "Conflicto al crear usuario",
            description: message || "Uno de los campos ya existe en la base de datos.",
          })
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error al crear usuario",
          description: error.message || error.response?.data?.message || "Ocurrió un error inesperado.",
        })
      }
    }
  }

  const primaryCenterId = form.watch("id_CentroVacunacion")
  const additionalCenterIds = form.watch("additionalCenters")?.map((c) => c.id) || []

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="Nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Juan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="Apellido"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="Cedula_Usuario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cédula</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 1-1234-5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="Email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="Clave"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="id_Rol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    form.setValue("id_CentroVacunacion", "")
                    form.setValue("additionalCenters", [])
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingRoles ? (
                      <SelectItem value="loading" disabled>Cargando...</SelectItem>
                    ) : (
                      roles.map((role) => (
                        <SelectItem key={role.id_Rol} value={String(role.id_Rol)}>
                          {role.Rol}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {(selectedRole === "2" || selectedRole === "6" || selectedRole === "3") && (
            <FormField
              control={form.control}
              name="id_CentroVacunacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro Principal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un centro" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingCenters ? (
                        <SelectItem value="loading" disabled>Cargando...</SelectItem>
                      ) : (
                        centers
                          .filter((c) => !additionalCenterIds.includes(String(c.id_CentroVacunacion)))
                          .map((center) => (
                            <SelectItem key={center.id_CentroVacunacion} value={String(center.id_CentroVacunacion)}>
                              {center.Nombre}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {selectedRole === "2" && (
          <div className="space-y-3">
            <FormLabel>Centros Adicionales</FormLabel>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name={`additionalCenters.${index}.id`}
                  render={({ field: itemField }) => (
                    <FormItem className="flex-grow">
                      <Select onValueChange={itemField.onChange} defaultValue={itemField.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un centro adicional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingCenters ? (
                            <SelectItem value="loading" disabled>Cargando...</SelectItem>
                          ) : (
                            centers
                              .filter(
                                (c) =>
                                  String(c.id_CentroVacunacion) !== primaryCenterId &&
                                  !additionalCenterIds.filter((id) => id !== itemField.value).includes(String(c.id_CentroVacunacion)),
                              )
                              .map((center) => (
                                <SelectItem key={center.id_CentroVacunacion} value={String(center.id_CentroVacunacion)}>
                                  {center.Nombre}
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-1">
                  <XCircle className="h-5 w-5 text-red-500" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => append({ id: "" })}
              disabled={loadingCenters || !primaryCenterId}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Centro Adicional
            </Button>
            <FormMessage>{form.formState.errors.additionalCenters?.message}</FormMessage>
          </div>
        )}

        <Button type="submit" disabled={isCreating} className="w-full mt-6">
          {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isCreating ? "Creando Usuario..." : "Crear Usuario"}
        </Button>
      </form>
    </Form>
  )
}
