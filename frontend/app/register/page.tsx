"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    Nombres: "",
    Apellidos: "",
    TipoIdentificacion: "Cédula",
    NumeroIdentificacion: "",
    Telefono: "",
    Direccion: "",
    Email: "",
    Password: "",
    Username: "",
  })

  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("http://localhost:3001/api/tutors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al registrar usuario")
      }

      toast({
        title: "Registro exitoso",
        description: "Su cuenta ha sido creada correctamente. Ahora puede iniciar sesión.",
      })

      router.push("/login")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: error instanceof Error ? error.message : "Error al registrar usuario",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Crear una cuenta</CardTitle>
          <CardDescription>Ingrese sus datos personales para registrarse en el sistema</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="TipoIdentificacion">Tipo de Identificación</Label>
              <Input
                id="TipoIdentificacion"
                name="TipoIdentificacion"
                value={formData.TipoIdentificacion}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="NumeroIdentificacion">Número de Identificación</Label>
              <Input
                id="NumeroIdentificacion"
                name="NumeroIdentificacion"
                value={formData.NumeroIdentificacion}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="Nombres">Nombres</Label>
                <Input id="Nombres" name="Nombres" value={formData.Nombres} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Apellidos">Apellidos</Label>
                <Input id="Apellidos" name="Apellidos" value={formData.Apellidos} onChange={handleChange} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="Telefono">Teléfono</Label>
              <Input id="Telefono" name="Telefono" value={formData.Telefono} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Direccion">Dirección</Label>
              <Input id="Direccion" name="Direccion" value={formData.Direccion} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Email">Correo Electrónico</Label>
              <Input id="Email" name="Email" type="email" value={formData.Email} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Username">Nombre de Usuario</Label>
              <Input id="Username" name="Username" value={formData.Username} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Password">Contraseña</Label>
              <Input
                id="Password"
                name="Password"
                type="password"
                value={formData.Password}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrarse"
              )}
            </Button>
            <div className="text-center text-sm">
              ¿Ya tiene una cuenta?{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Iniciar Sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
