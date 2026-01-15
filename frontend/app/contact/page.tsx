"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Phone, Mail, MapPin, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-5xl">
            <Link href="/">
                <Button variant="ghost" size="sm" className="mb-8">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Inicio
                </Button>
            </Link>

            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-4">Contáctanos</h1>
                        <p className="text-xl text-muted-foreground">
                            Estamos aquí para ayudarte. Si tienes preguntas sobre el proceso de vacunación o el uso de la plataforma,
                            no dudes en escribirnos.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Phone className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold">Teléfono</p>
                                <p className="text-muted-foreground">800-VACUNA (822-862)</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-3 rounded-full">
                                <Mail className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="font-semibold">Email</p>
                                <p className="text-muted-foreground">info@vacunasegura.gob.do</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <MapPin className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-semibold">Oficina Central</p>
                                <p className="text-muted-foreground">Av. Tiradentes esq. San Cristóbal, Santo Domingo, R.D.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Envíanos un mensaje</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" placeholder="Tu nombre completo" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="tu@email.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Mensaje</Label>
                            <Textarea id="message" placeholder="¿En qué podemos ayudarte?" rows={5} />
                        </div>
                        <Button className="w-full bg-green-600 hover:bg-green-700">Enviar Mensaje</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
