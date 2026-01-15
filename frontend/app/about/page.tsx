"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-3xl">
            <Link href="/">
                <Button variant="ghost" size="sm" className="mb-8">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Inicio
                </Button>
            </Link>

            <h1 className="text-4xl font-bold mb-6">Acerca de Vacunas RD</h1>
            <p className="text-xl text-muted-foreground mb-8">
                El Sistema Nacional de Vacunación es una iniciativa del Ministerio de Salud Pública de la República Dominicana
                para garantizar el acceso equitativo y eficiente a las inmunizaciones.
            </p>

            <div className="space-y-6">
                <section>
                    <h2 className="text-2xl font-semibold mb-4">Nuestra Misión</h2>
                    <p>
                        Proteger a la población dominicana contra enfermedades prevenibles por vacunación mediante la administración
                        de biológicos de alta calidad, siguiendo los más estrictos estándares internacionales de salud pública.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">Tecnología al Servicio de la Salud</h2>
                    <p>
                        Este portal utiliza tecnologías de vanguardia para permitir a los ciudadanos gestionar sus citas, consultar
                        su historial de vacunación y descargar certificados oficiales de forma inmediata y segura.
                    </p>
                </section>
            </div>
        </div>
    )
}
