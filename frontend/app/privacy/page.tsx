"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-3xl">
            <Link href="/">
                <Button variant="ghost" size="sm" className="mb-8">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Inicio
                </Button>
            </Link>

            <h1 className="text-4xl font-bold mb-6">Política de Privacidad</h1>
            <div className="prose dark:prose-invert max-w-none space-y-4">
                <p>
                    En Vacunas RD, valoramos la privacidad de su información personal y médica. Esta política describe cómo
                    recopilamos, usamos y protegemos sus datos.
                </p>
                <h2 className="text-2xl font-semibold mt-8">1. Datos Recopilados</h2>
                <p>
                    Recopilamos información de identificación (cédula, nombre, contacto) y datos de salud relacionados exclusivamente
                    con el historial de vacunación y citas programadas.
                </p>
                <h2 className="text-2xl font-semibold mt-8">2. Uso de la Información</h2>
                <p>
                    Los datos se utilizan únicamente para gestionar su esquema de vacunación, emitir certificados oficiales y
                    proporcionar estadísticas anónimas de salud pública al Ministerio de Salud.
                </p>
                <h2 className="text-2xl font-semibold mt-8">3. Seguridad</h2>
                <p>
                    Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos contra el acceso no autorizado
                    o la divulgación indebida, siguiendo los protocolos de ciberseguridad gubernamentales.
                </p>
            </div>
        </div>
    )
}
