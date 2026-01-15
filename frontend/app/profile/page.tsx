"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { User, Mail, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
    const { user } = useAuth()

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
                        <User className="h-6 w-6" />
                        Perfil de Usuario
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center py-4">
                        <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <User className="h-12 w-12 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold">{user?.email?.split('@')[0]}</h2>
                        <p className="text-muted-foreground">{user?.role}</p>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center space-x-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Correo Electrónico</p>
                                <p className="font-medium">{user?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Rol del Sistema</p>
                                <p className="font-medium">{user?.role}</p>
                            </div>
                        </div>
                    </div>

                    <Button className="w-full" variant="outline" disabled>Editar Perfil (Próximamente)</Button>
                </CardContent>
            </Card>
        </div>
    )
}
