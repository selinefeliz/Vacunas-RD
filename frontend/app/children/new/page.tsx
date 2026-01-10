"use client"

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import useApi from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NewChildPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { request: registerChild, loading: formLoading, error: apiError } = useApi<any>();
  const [activationCode, setActivationCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    Nombres: "",
    Apellidos: "",
    FechaNacimiento: "",
    Genero: "",
    DireccionResidencia: "",

  });

  useEffect(() => {
    // Redirect if user is not a Tutor or not logged in
    if (!authLoading && user?.id_Rol !== 5) {
      toast({ variant: "destructive", title: "Acceso denegado", description: "Debe ser un tutor para registrar un niño." });
      router.push('/dashboard');
    }
  }, [user, authLoading, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, Genero: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActivationCode(null); // Reset previous activation code

    try {
      const result = await registerChild('/api/ninos', {
        method: 'POST',
        body: formData,
      });

      if (result && result.CodigoActivacion) {
        setActivationCode(result.CodigoActivacion);
        toast({ title: "Niño registrado con éxito", description: "El código de activación se muestra a continuación." });
        setFormData({ Nombres: "", Apellidos: "", FechaNacimiento: "", Genero: "", DireccionResidencia: "" }); // Reset form
      } else {
        throw new Error(apiError || 'No se recibió el código de activación.');
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error en el registro", description: err.message || "Ocurrió un error inesperado." });
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <Card className="w-full max-w-2xl border-gray-200 dark:border-gray-800 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
          <CardTitle>Registrar Nuevo Niño</CardTitle>
          <CardDescription>Complete el formulario para registrar un niño bajo su tutela.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {activationCode && (
              <Alert variant="default" className="bg-green-100 border-green-400 text-green-700">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>¡Registro Exitoso!</AlertTitle>
                <AlertDescription className="font-mono text-lg">
                  Guarde este código de activación para vincular a otro tutor: <strong>{activationCode}</strong>
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="Nombres">Nombres</Label>
                <Input id="Nombres" name="Nombres" value={formData.Nombres} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Apellidos">Apellidos</Label>
                <Input id="Apellidos" name="Apellidos" value={formData.Apellidos} onChange={handleChange} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="FechaNacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="FechaNacimiento"
                  name="FechaNacimiento"
                  type="date"
                  value={formData.FechaNacimiento}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Genero">Género</Label>
                <Select name="Genero" onValueChange={handleSelectChange} value={formData.Genero} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                    <SelectItem value="O">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="DireccionResidencia">Dirección de Residencia</Label>
              <Input id="DireccionResidencia" name="DireccionResidencia" value={formData.DireccionResidencia} onChange={handleChange} required />
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={formLoading || authLoading}>
              {formLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...</> : "Registrar Niño"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
