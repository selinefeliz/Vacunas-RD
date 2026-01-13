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

const formSchema = z.object({
    Cedula_Usuario: z.string().min(1, "Cédula es requerida"),
    Email: z.string().email("Debe ser un email válido"),
    id_Rol: z.string().min(1, "El rol es requerido"),
    id_Estado: z.string().min(1, "El estado es requerido"),
    // Password and Name are not editable here based on the PUT /api/users/:id endpoint logic seen in backend/routes/users.js
    // Wait, let's check backend/routes/users.js again.
    // PUT /api/users/:id accepts: id_Rol, id_Estado, Cedula_Usuario, Email.
    // It does NOT accept Nombre/Apellido updates?
    // Let's re-read backend/routes/users.js lines 118-137.
})

// Schema for editing
const editFormSchema = z.object({
    Cedula_Usuario: z.string().min(1, "Cédula es requerida"),
    Email: z.string().email("Debe ser un email válido"),
    id_Rol: z.string().min(1, "El rol es requerido"),
    id_Estado: z.string().min(1, "El estado es requerido"),
    id_CentroVacunacion: z.string().optional(),
    additionalCenters: z.array(z.object({ id: z.string().min(1, "Debe seleccionar un centro") })).optional(),
    Nombre: z.string().optional(),
    Apellido: z.string().optional(),
}).refine(
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

interface User {
    id_Usuario: number
    Cedula_Usuario: string
    Email: string
    NombreRol: string
    Estado: string
    id_Rol?: number // We might need to fetch the single user details first to get IDs
    id_Estado?: number
}

interface EditAdminUserFormProps {
    userId: number
    onSuccess: () => void
}

export function EditAdminUserForm({ userId, onSuccess }: EditAdminUserFormProps) {
    const { toast } = useToast()
    const { request: updateUser, loading: isUpdating } = useApi()
    const { request: fetchUser, loading: isLoadingUser } = useApi<any>() // Fetch full user details
    const { request: fetchRoles } = useApi<Role[]>()

    interface VaccinationCenter {
        id_CentroVacunacion: number
        Nombre: string
    }

    const [centers, setCenters] = useState<VaccinationCenter[]>([])
    const { request: fetchCenters, loading: loadingCenters } = useApi<VaccinationCenter[]>()
    const { request: fetchUserCenters } = useApi<any[]>()

    const [roles, setRoles] = useState<Role[]>([])

    const form = useForm<z.infer<typeof editFormSchema>>({
        resolver: zodResolver(editFormSchema),
        defaultValues: {
            Cedula_Usuario: "",
            Email: "",
            id_Rol: "",
            id_Estado: "",
            id_CentroVacunacion: "",
            additionalCenters: [],
            Nombre: "",
            Apellido: "",
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "additionalCenters",
    })

    // Watch for role changes to conditionally show center fields
    const selectedRole = form.watch("id_Rol")

    useEffect(() => {
        const loadData = async () => {
            // 1. Fetch Roles
            try {
                const rolesData = await fetchRoles("/api/roles")
                if (rolesData) setRoles(rolesData)
            } catch (error) {
                console.error("Failed to fetch roles", error)
            }

            // 2. Fetch Centers
            try {
                const centersData = await fetchCenters("/api/vaccination-centers")
                if (centersData) setCenters(centersData)
            } catch (error) {
                console.error("Failed to fetch centers", error)
            }

            // 3. Fetch User Details & Assigned Centers
            try {
                const userData = await fetchUser(`/api/users/${userId}`)

                let existingAdditionalCenters: any[] = []
                // Only fetch centers if role implies it (or just always try, it won't hurt)
                if (userData) {
                    try {
                        const userCenters = await fetchUserCenters(`/api/users/${userId}/centers`)
                        if (userCenters) {
                            // Filter out the one that is marked 'Principal' or matches id_CentroVacunacion
                            // The SP returns TipoAsignacion 'Principal' or 'Adicional'
                            existingAdditionalCenters = userCenters
                                .filter((c: any) => c.TipoAsignacion === 'Adicional')
                                .map((c: any) => ({ id: String(c.id_CentroVacunacion) }))
                        }
                    } catch (e) {
                        console.log("No extra centers found or error fetching them")
                    }

                    form.reset({
                        Cedula_Usuario: userData.Cedula_Usuario,
                        Email: userData.Email,
                        id_Rol: String(userData.id_Rol),
                        id_Estado: String(userData.id_Estado),
                        Nombre: userData.Nombre || "",
                        Apellido: userData.Apellido || "",
                        id_CentroVacunacion: userData.id_CentroVacunacion ? String(userData.id_CentroVacunacion) : "",
                        additionalCenters: existingAdditionalCenters,
                    })
                }
            } catch (error) {
                console.error("Failed to fetch user", error)
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudo cargar la información del usuario."
                })
            }
        }
        loadData()
    }, [userId, fetchRoles, fetchUser, fetchCenters, fetchUserCenters, form, toast])

    async function onSubmit(values: z.infer<typeof editFormSchema>) {
        const payload = {
            ...values,
            id_Rol: parseInt(values.id_Rol),
            id_Estado: parseInt(values.id_Estado),
            id_CentroVacunacion: (values.id_Rol === "2" || values.id_Rol === "6" || values.id_Rol === "3") ? values.id_CentroVacunacion : null,
            additionalCenters: (values.id_Rol === "2" || values.id_Rol === "3" || values.id_Rol === "6") ? values.additionalCenters?.map((c) => c.id) : [],
        }

        try {
            await updateUser(`/api/users/${userId}`, {
                method: "PUT",
                body: payload,
            })
            toast({
                title: "Éxito",
                description: "Usuario actualizado correctamente.",
            })
            onSuccess()
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error al actualizar",
                description: error.message || "Ocurrió un error inesperado.",
            })
        }
    }

    if (isLoadingUser) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>

    const primaryCenterId = form.watch("id_CentroVacunacion")
    const additionalCenterIds = form.watch("additionalCenters")?.map((c) => c.id) || []

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="Cedula_Usuario"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cédula</FormLabel>
                            <FormControl>
                                <Input {...field} />
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
                                <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="id_Rol"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rol</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione rol" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id_Rol} value={String(role.id_Rol)}>
                                                {role.Rol}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="id_Estado"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione estado" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="1">Activo</SelectItem>
                                        <SelectItem value="2">Inactivo</SelectItem>
                                        <SelectItem value="3">Bloqueado</SelectItem>
                                        <SelectItem value="4">Pendiente</SelectItem>
                                        {/* Assuming explicit IDs for states based on initial insert: 1=Activo, 2=Inactivo... */}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {(selectedRole === "2" || selectedRole === "6" || selectedRole === "3") && (
                    <FormField
                        control={form.control}
                        name="id_CentroVacunacion"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Centro Principal</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
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

                {(selectedRole === "2" || selectedRole === "3" || selectedRole === "6") && (
                    <div className="space-y-3 border p-3 rounded-md">
                        <FormLabel>Centros Adicionales</FormLabel>
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-start gap-2">
                                <FormField
                                    control={form.control}
                                    name={`additionalCenters.${index}.id`}
                                    render={({ field: itemField }) => (
                                        <FormItem className="flex-grow">
                                            <Select onValueChange={itemField.onChange} value={itemField.value}>
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
                        <div className="flex justify-start">
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
                        </div>
                        <FormMessage>{form.formState.errors.additionalCenters?.message}</FormMessage>
                    </div>
                )}

                <Button type="submit" disabled={isUpdating} className="w-full">
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Actualizar Usuario
                </Button>
            </form>
        </Form>
    )
}
