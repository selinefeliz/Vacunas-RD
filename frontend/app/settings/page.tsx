"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Moon, Sun, Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()

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
                        <Button variant="destructive" className="w-full" disabled>Cambiar Contraseña</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
