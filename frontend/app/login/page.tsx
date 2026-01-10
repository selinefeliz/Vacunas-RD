"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const { login, user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If the user is already authenticated when they land on the login page,
    // redirect them based on their role using the AuthContext's logic.
    // This avoids being stuck on the login page if already logged in.
    if (user && !loading) { // Ensure not in initial loading state
      // The AuthContext's login function already handles role-based redirection.
      // We can trigger a similar logic here or simply redirect to a default page
      // if the user is already authenticated.
      // For simplicity, let's rely on the initial redirection done by AuthProvider
      // or redirect to a sensible default like '/dashboard'.
      // If the user is 'Administrador', special UI is shown, so don't redirect immediately.
      if (user.role === "Administrador") {
        setIsAdmin(true); // This will show the admin-specific UI on the login page
      } else if (user.id_Rol === 2) { // 'Médico'
        router.push('/admin/inventory');
      } else if (user.id_Rol === 3) { // 'Enfermera'
        router.push('/management/medical/select-center');
      } else if (user.id_Rol === 6) {
        router.push('/management/availability');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      console.log(`[LoginPage] Attempting login with Email/Cedula: '${email}', Password: '${password}'`);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ LoginIdentifier: email, Password: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      console.log('[LoginPage] User data from API to be passed to AuthContext:', JSON.stringify(data.user, null, 2));
      login(data.token, data.user);

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md p-8 space-y-4">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Modo Administrador</CardTitle>
            <CardDescription className="text-center">
              Has iniciado sesión correctamente como administrador. Por favor elige tu destino.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <Button onClick={() => router.push('/dashboard')}>Ir a Vista Personal (Tutor)</Button>
            <Button onClick={() => router.push('/admin/login')} variant="secondary">Ir al Portal Administrativo</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tu correo electrónico o tu número de identificación para acceder a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo o Identificación</Label>
              <Input
                id="email"
                type="text"
                placeholder="nombre@ejemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/register" className="text-sm text-blue-600 hover:underline">
              ¿No tienes cuenta? Regístrate
            </Link>
            <Button disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Iniciar Sesión
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
