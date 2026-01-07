"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Search,
  FileText,
  Calendar,
  Users,
  HelpCircle,
  ArrowLeft,
  MessageCircle,
  Download,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "@/contexts/theme-context"
import { useState } from "react"

export default function AyudaPage() {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")

  const faqData = [
    {
      id: "1",
      question: "¿Cómo puedo agendar una cita de vacunación?",
      answer:
        "Puedes agendar tu cita de tres formas: 1) A través de nuestra plataforma web ingresando a 'Agendar cita', 2) Llamando al 800-VACUNA (822-862), o 3) Visitando directamente cualquier centro de vacunación autorizado. Necesitarás tu cédula de identidad y seleccionar el centro más cercano a tu ubicación.",
    },
    {
      id: "2",
      question: "¿Qué documentos necesito para vacunarme?",
      answer:
        "Solo necesitas tu cédula de identidad dominicana vigente. En caso de menores de edad, se requiere la cédula del menor (si la tiene) o acta de nacimiento, acompañado de un adulto responsable con su cédula.",
    },
    {
      id: "3",
      question: "¿Cómo descargo mi certificado de vacunación?",
      answer:
        "Una vez vacunado, puedes descargar tu certificado digital ingresando a 'Mi Vacunación' con tu cédula. El certificado estará disponible 24 horas después de recibir la vacuna y tiene validez oficial para viajes y trámites.",
    },
    {
      id: "4",
      question: "¿Las vacunas son gratuitas?",
      answer:
        "Sí, todas las vacunas del esquema nacional de vacunación son completamente gratuitas para todos los ciudadanos dominicanos y residentes legales. No se cobra ningún tipo de tarifa por la vacuna ni por el certificado digital.",
    },
    {
      id: "5",
      question: "¿Puedo cambiar o cancelar mi cita?",
      answer:
        "Sí, puedes modificar o cancelar tu cita hasta 2 horas antes de la hora programada. Ingresa a 'Mi Vacunación' con tu cédula, busca tu cita activa y selecciona 'Modificar' o 'Cancelar'. También puedes llamar al 800-VACUNA.",
    },
    {
      id: "6",
      question: "¿Qué hago si perdí mi carnet de vacunación físico?",
      answer:
        "No te preocupes, tu historial de vacunación está guardado digitalmente en nuestro sistema. Puedes acceder a 'Mi Vacunación' para ver tu historial completo y descargar un nuevo certificado digital que tiene la misma validez que el carnet físico.",
    },
    {
      id: "7",
      question: "¿Cuáles son los efectos secundarios normales?",
      answer:
        "Los efectos secundarios más comunes son leves y temporales: dolor en el sitio de inyección, fatiga leve, dolor de cabeza o fiebre baja. Estos síntomas suelen desaparecer en 1-2 días. Si experimentas efectos severos o prolongados, consulta a tu médico.",
    },
    {
      id: "8",
      question: "¿Puedo vacunarme si estoy embarazada?",
      answer:
        "Sí, muchas vacunas son seguras durante el embarazo y se recomiendan para proteger tanto a la madre como al bebé. Sin embargo, debes consultar con tu médico obstetra antes de vacunarte para recibir orientación específica según tu caso.",
    },
  ]

  const filteredFAQ = faqData.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src={theme === "light" ? "/images/logo-vacunas-rd.jpeg" : "/images/logo-vacunas-rd-dark.jpeg"}
                alt="VACUNAS RD - Logo oficial"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">VACUNAS RD</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Ministerio de Salud Pública</p>
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al inicio</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Centro de Ayuda</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Encuentra respuestas a tus preguntas sobre vacunación y el uso de nuestra plataforma
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar en preguntas frecuentes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-green-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Acciones Rápidas</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <Calendar className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <CardTitle className="text-gray-900 dark:text-white">Agendar Cita</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-400 mb-4">
                  Programa tu cita de vacunación en línea
                </CardDescription>
                <Link href="/agendar">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">Agendar Ahora</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <FileText className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <CardTitle className="text-gray-900 dark:text-white">Mi Certificado</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-400 mb-4">
                  Descarga tu certificado de vacunación
                </CardDescription>
                <Link href="/mi-vacunacion">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">Descargar</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <MapPin className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                <CardTitle className="text-gray-900 dark:text-white">Centros Cercanos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-400 mb-4">
                  Encuentra centros de vacunación
                </CardDescription>
                <Link href="/centros">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">Buscar Centros</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Preguntas Frecuentes</h2>

            {filteredFAQ.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No se encontraron preguntas que coincidan con tu búsqueda.
                </p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFAQ.map((item) => (
                  <AccordionItem
                    key={item.id}
                    value={item.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6"
                  >
                    <AccordionTrigger className="text-left text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">¿Necesitas más ayuda?</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span>Línea de Atención</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">800-VACUNA (822-862)</p>
                    <p className="text-gray-600 dark:text-gray-400">Llamada gratuita desde cualquier operador</p>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Lunes a Viernes: 8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Sábados: 8:00 AM - 2:00 PM</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Soporte por Email</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">soporte@vacunasrd.gob.do</p>
                    <p className="text-gray-600 dark:text-gray-400">Respuesta en 24-48 horas</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">info@vacunasrd.gob.do</p>
                    <p className="text-gray-600 dark:text-gray-400">Información general</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Additional Resources */}
            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <Card className="text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <Download className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <CardTitle className="text-gray-900 dark:text-white">Guías Descargables</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-400 mb-4">
                    Manuales y guías en PDF para usar la plataforma
                  </CardDescription>
                  <Button
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Descargar Guías
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <CardTitle className="text-gray-900 dark:text-white">Chat en Vivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-400 mb-4">
                    Habla con un agente en tiempo real
                  </CardDescription>
                  <Button
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Iniciar Chat
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <CardTitle className="text-gray-900 dark:text-white">Comunidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-400 mb-4">
                    Únete a nuestro foro de usuarios
                  </CardDescription>
                  <Button
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Ver Foro
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Alert */}
      <section className="py-8 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">¿Tienes una emergencia médica?</h3>
                <p className="text-red-700 dark:text-red-400 mb-4">
                  Si experimentas una reacción alérgica severa o efectos secundarios graves después de la vacunación,
                  busca atención médica inmediata o llama al 911.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Badge className="bg-red-600 text-white">Emergencias: 911</Badge>
                  <Badge className="bg-red-600 text-white">Línea COVID: *462</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
