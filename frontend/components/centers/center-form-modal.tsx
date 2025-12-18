"use client"

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useApi from "@/hooks/use-api";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

// Interfaces for API data
interface Province {
  name: string;
  code: string;
  identifier: string;
}

interface Municipality {
  name: string;
  code: string;
  identifier: string;
  provinceCode: string;
}

interface CenterStatus {
  id_Estado: number;
  NombreEstado: string;
}

// Zod schema for form validation, aligned with backend
const formSchema = z.object({
  Nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  Director: z.string().min(3, { message: "El nombre del director es requerido." }).optional().or(z.literal('')),
  Direccion: z.string().min(5, { message: "La dirección es requerida." }),
  id_Provincia: z.string().min(1, { message: "Debe seleccionar una provincia." }),
  id_Municipio: z.string().min(1, { message: "Debe seleccionar un municipio." }),
  Telefono: z.string().min(8, { message: "El teléfono debe ser válido." }).optional().or(z.literal('')),
  URLGoogleMaps: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal('')),
  Capacidad: z.coerce.number().int().positive({ message: "La capacidad debe ser un número positivo." }),
  id_Estado: z.coerce.number().positive({ message: "Debe seleccionar un estado." }),
});

const defaultValues = {
  Nombre: "",
  Director: "",
  Direccion: "",
  URLGoogleMaps: "",
  Telefono: "",
  Capacidad: 100,
  id_Provincia: "",
  id_Municipio: "",
  id_Estado: 0,
};

interface CenterFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center: any | null; // Using 'any' for flexibility with incoming data structure
  onFormSubmit: () => void; // Callback to refresh data
}

export const CenterFormModal = ({ open, onOpenChange, center, onFormSubmit }: CenterFormModalProps) => {
  const { toast } = useToast();
  const { token } = useAuth();
  const isEditing = !!center;

  // State for dropdown data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [statuses, setStatuses] = useState<CenterStatus[]>([]);

  // API hooks
  const { request: fetchData } = useApi();
  const { request: submitForm, loading: isSubmitting } = useApi();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);

  const getMunicipalities = useCallback(async (provinceCode: string) => {
    if (!provinceCode) return;
    setIsLoadingMunicipalities(true);
    try {
      const data = await fetchData(`/api/territories/municipalities?provinceCode=${provinceCode}`);
      setMunicipalities(data || []);
      return data;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al cargar municipios' });
      return [];
    } finally {
      setIsLoadingMunicipalities(false);
    }
  }, [fetchData, toast]);

  // Fetch initial data for dropdowns
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingProvinces(true);
      try {
        const provincesData = await fetchData('/api/territories/provinces');
        setProvinces(provincesData || []);

        const statusesData = await fetchData('/api/vaccination-centers/statuses');
        setStatuses(statusesData || []);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error al cargar datos iniciales' });
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    if (open) {
      loadInitialData();
    }
  }, [open, fetchData, toast]);

  // Populate form when editing
  useEffect(() => {
    if (isEditing && center && provinces.length > 0 && statuses.length > 0) {
      form.reset(defaultValues); // Reset to defaults before populating

      const province = provinces.find(p => p.name === center.Provincia);
      if (province) {
        form.setValue('id_Provincia', province.code);
        getMunicipalities(province.code).then((munis) => {
          if (munis) {
            const municipality = munis.find((m: Municipality) => m.name === center.Municipio);
            if (municipality) {
              form.setValue('id_Municipio', municipality.code);
            }
          }
        });
      }

      const status = statuses.find(s => s.NombreEstado === center.Estado);
      if (status) {
        form.setValue('id_Estado', status.id_Estado);
      }

      // Set remaining fields
      form.setValue('Nombre', center.Nombre || "");
      form.setValue('Director', center.Director || "");
      form.setValue('Direccion', center.Direccion || "");
      form.setValue('URLGoogleMaps', center.URLGoogleMaps || "");
      form.setValue('Telefono', center.Telefono || "");
      form.setValue('Capacidad', center.Capacidad || 100);

    } else if (!isEditing) {
      form.reset(defaultValues);
    }
  }, [center, isEditing, form, provinces, statuses, getMunicipalities]);

  // Handle province change to fetch municipalities
  const handleProvinceChange = (provinceCode: string) => {
    form.setValue('id_Municipio', ""); // Reset municipality selection
    setMunicipalities([]);
    getMunicipalities(provinceCode);
  };

  const [showSuccess, setShowSuccess] = useState(false);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const endpoint = isEditing ? `/api/vaccination-centers/${center.id_CentroVacunacion}` : '/api/vaccination-centers';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      await submitForm(endpoint, { method, body: values });
      setShowSuccess(true);
      onFormSubmit();

      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false);
        setShowSuccess(false);
      }, 2000);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error al guardar el centro', description: err.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Centro de Vacunación" : "Crear Nuevo Centro"}</DialogTitle>
          <DialogDescription>{isEditing ? "Actualiza la información del centro." : "Completa el formulario para añadir un nuevo centro."}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">¡Registro Exitoso!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">El centro de vacunación ha sido guardado correctamente.</p>
              </div>
              <div className="w-full h-1 bg-gray-100 mt-4 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 animate-[progress_2s_linear]" style={{ width: '100%' }}></div>
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="Nombre" render={({ field }) => (<FormItem><FormLabel>Nombre del Centro</FormLabel><FormControl><Input placeholder="Ej: Centro de Salud Metropolitano" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="Director" render={({ field }) => (<FormItem><FormLabel>Director</FormLabel><FormControl><Input placeholder="Ej: Dr. Juan Pérez" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="Direccion" render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input placeholder="Ej: Av. Central, Calle 5" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="id_Provincia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleProvinceChange(value);
                        }}
                        value={field.value}
                        disabled={isLoadingProvinces}
                      >
                        <FormControl>
                          <SelectTrigger>
                            {isLoadingProvinces ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue placeholder="Seleccione una provincia" />}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {provinces.map(p => <SelectItem key={p.identifier || p.code} value={p.code}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="id_Municipio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Municipio</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                        disabled={!form.watch('id_Provincia') || municipalities.length === 0 || isLoadingMunicipalities}
                      >
                        <FormControl>
                          <SelectTrigger>
                            {isLoadingMunicipalities ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue placeholder="Seleccione un municipio" />}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {municipalities.map(m => <SelectItem key={m.identifier || m.code} value={m.code}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="Telefono" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="Ej: 809-555-1234" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="URLGoogleMaps" render={({ field }) => (<FormItem><FormLabel>URL de Google Maps</FormLabel><FormControl><Input placeholder="https://maps.app.goo.gl/..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="Capacidad" render={({ field }) => (<FormItem><FormLabel>Capacidad</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="id_Estado" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger></FormControl><SelectContent>{statuses.map(s => <SelectItem key={s.id_Estado} value={String(s.id_Estado)}>{s.NombreEstado}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {isEditing ? "Guardar Cambios" : "Crear Centro"}</Button>
              </DialogFooter>
            </form>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
};
