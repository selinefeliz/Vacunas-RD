"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Bell, Moon, Sun, Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const { toast } = useToast()
    const { token } = useAuth()

    // Estados para cambio de contraseña
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    })

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value })
    }

    const submitChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (passwords.new !== passwords.confirm) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Las nuevas contraseñas no coinciden."
            })
            return
        }

        setLoading(true)
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || "Error al cambiar contraseña")
            }

            toast({
                title: "Éxito",
                description: "Contraseña actualizada correctamente."
            })
            setIsChangingPassword(false)
            setPasswords({ current: "", new: "", confirm: "" })

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-12 px-4 max-w-2xl">
            <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mb-8">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Dashboard
                </Button>
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Lock className="h-6 w-6" />
                        Configuración
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                                <Label htmlFor="notifications">Notificaciones por Correo</Label>
                            </div>
                            <Switch id="notifications" defaultChecked />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                                <Label htmlFor="theme">Modo Oscuro</Label>
                            </div>
                            <Switch
                                id="theme"
                                checked={theme === "dark"}
                                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-4 text-red-600">Seguridad</h3>

                        {!isChangingPassword ? (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setIsChangingPassword(true)}
                            >
                                Cambiar Contraseña
                            </Button>
                        ) : (
                            <form onSubmit={submitChangePassword} className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                                <div className="space-y-2">
                                    <Label htmlFor="current">Contraseña Actual</Label>
                                    <Input
                                        id="current"
                                        name="current"
                                        type="password"
                                        value={passwords.current}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new">Nueva Contraseña</Label>
                                    <Input
                                        id="new"
                                        name="new"
                                        type="password"
                                        value={passwords.new}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Mínimo 12 caracteres (Ayus, Minus, Números, Símbolos)</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm">Confirmar Nueva Contraseña</Label>
                                    <Input
                                        id="confirm"
                                        name="confirm"
                                        type="password"
                                        value={passwords.confirm}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsChangingPassword(false)}
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? "Guardando..." : "Guardar Nueva Contraseña"}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
