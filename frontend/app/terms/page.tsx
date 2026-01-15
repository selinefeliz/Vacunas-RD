"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-3xl">
            <Link href="/">
                <Button variant="ghost" size="sm" className="mb-8">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Inicio
                </Button>
            </Link>

            <h1 className="text-4xl font-bold mb-6">Términos y Condiciones</h1>
            <div className="prose dark:prose-invert max-w-none space-y-4">
                <p>
                    Al utilizar la plataforma Vacunas RD, usted acepta cumplir con los siguientes términos de uso.
                </p>
                <h2 className="text-2xl font-semibold mt-8">1. Veracidad de la Información</h2>
                <p>
                    Usted se compromete a proporcionar datos verídicos y actualizados. El uso de identidades falsas es una
                    violación de los términos y puede ser reportado a las autoridades.
                </p>
                <h2 className="text-2xl font-semibold mt-8">2. Propiedad de los Documentos</h2>
                <p>
                    Los certificados de vacunación emitidos son documentos oficiales del Ministerio de Salud. Su alteración o
                    falsificación es un delito legal.
                </p>
                <h2 className="text-2xl font-semibold mt-8">3. Disponibilidad del Servicio</h2>
                <p>
                    Nos esforzamos por mantener la plataforma disponible 24/7, pero no nos hacemos responsables por interrupciones
                    técnicas temporales o mantenimiento programado.
                </p>
            </div>
        </div>
    )
}
