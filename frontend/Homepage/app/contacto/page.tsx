"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowLeft,
  Send,
  MessageCircle,
  Building,
  HeadphonesIcon,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "@/contexts/theme-context"
import { useState } from "react"

export default function ContactoPage() {
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    departamento: "",
    mensaje: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simular envío del formulario
    setTimeout(() => {
      setIsSubmitting(false)
      alert("Mensaje enviado correctamente. Te contactaremos pronto.")
      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        asunto: "",
        departamento: "",
        mensaje: "",
      })
    }, 2000)
  }

  const departamentos = [
    { value: "general", label: "Consulta General" },
    { value: "citas", label: "Agendamiento de Citas" },
    { value: "certificados", label: "Certificados Digitales" },
    { value: "tecnico", label: "Soporte Técnico" },
    { value: "quejas", label: "Quejas y Sugerencias" },
    { value: "prensa", label: "Prensa y Comunicaciones" },
  ]

  const oficinas = [
    {
      nombre: "Oficina Central - Ministerio de Salud Pública",
      direccion: "Av. Tiradentes #4, Ensanche Naco",
      ciudad: "Santo Domingo, D.N.",
      telefono: "(809) 541-3121",
      email: "info@msp.gob.do",
      horarios: "Lunes a Viernes: 8:00 AM - 4:00 PM",
      tipo: "principal",
    },
    {
      nombre: "Dirección General de Epidemiología",
      direccion: "Av. San Cristóbal #30, Gazcue",
      ciudad: "Santo Domingo, D.N.",
      telefono: "(809) 686-9140",
      email: "epidemiologia@msp.gob.do",
      horarios: "Lunes a Viernes: 7:00 AM - 3:00 PM",
      tipo: "departamento",
    },
    {
      nombre: "Oficina Regional Santiago",
      direccion: "Calle del Sol #45, Centro",
      ciudad: "Santiago de los Caballeros",
      telefono: "(809) 583-8000",
      email: "santiago@msp.gob.do",
      horarios: "Lunes a Viernes: 8:00 AM - 4:00 PM",
      tipo: "regional",
    },
    {
      nombre: "Oficina Regional Este",
      direccion: "Av. España #123, Zona Oriental",
      ciudad: "La Romana",
      telefono: "(809) 556-2200",
      email: "este@msp.gob.do",
      horarios: "Lunes a Viernes: 8:00 AM - 4:00 PM",
      tipo: "regional",
    },
  ]

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
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Contáctanos</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Estamos aquí para ayudarte. Ponte en contacto con nosotros para cualquier consulta sobre vacunación y
              nuestros servicios.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-8 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Canales de Comunicación
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <Phone className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <CardTitle className="text-gray-900 dark:text-white">Línea Directa</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">800-VACUNA</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Llamada gratuita 24/7</p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Llamar Ahora
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <Mail className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <CardTitle className="text-gray-900 dark:text-white">Email</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">info@vacunasrd.gob.do</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Respuesta en 24-48 horas</p>
                  <Button
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <MessageCircle className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                  <CardTitle className="text-gray-900 dark:text-white">Chat en Vivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Asistencia Inmediata</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Lun-Vie: 8:00 AM - 6:00 PM</p>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Iniciar Chat
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <HeadphonesIcon className="w-12 h-12 text-orange-600 dark:text-orange-400 mx-auto mb-4" />
                  <CardTitle className="text-gray-900 dark:text-white">Soporte Técnico</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">(809) 200-TECH</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Problemas con la plataforma</p>
                  <Button
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 w-full"
                  >
                    <HeadphonesIcon className="w-4 h-4 mr-2" />
                    Obtener Ayuda
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form and Offices */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Envíanos un Mensaje</h2>
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Fila 1: Nombre y Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nombre" className="text-gray-700 dark:text-gray-300">
                            Nombre Completo *
                          </Label>
                          <Input
                            id="nombre"
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => handleInputChange("nombre", e.target.value)}
                            className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                            Correo Electrónico *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            required
                          />
                        </div>
                      </div>

                      {/* Fila 2: Teléfono y Departamento */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="telefono" className="text-gray-700 dark:text-gray-300">
                            Teléfono
                          </Label>
                          <Input
                            id="telefono"
                            type="tel"
                            value={formData.telefono}
                            onChange={(e) => handleInputChange("telefono", e.target.value)}
                            className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="departamento" className="text-gray-700 dark:text-gray-300">
                            Departamento *
                          </Label>
                          <Select
                            value={formData.departamento}
                            onValueChange={(value) => handleInputChange("departamento", value)}
                          >
                            <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                              <SelectValue placeholder="Seleccionar departamento" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                              {departamentos.map((dept) => (
                                <SelectItem
                                  key={dept.value}
                                  value={dept.value}
                                  className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  {dept.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Fila 3: Asunto (ancho completo) */}
                      <div className="space-y-2">
                        <Label htmlFor="asunto" className="text-gray-700 dark:text-gray-300">
                          Asunto *
                        </Label>
                        <Input
                          id="asunto"
                          type="text"
                          value={formData.asunto}
                          onChange={(e) => handleInputChange("asunto", e.target.value)}
                          className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      {/* Fila 4: Mensaje (ancho completo) */}
                      <div className="space-y-2">
                        <Label htmlFor="mensaje" className="text-gray-700 dark:text-gray-300">
                          Mensaje *
                        </Label>
                        <Textarea
                          id="mensaje"
                          value={formData.mensaje}
                          onChange={(e) => handleInputChange("mensaje", e.target.value)}
                          rows={4}
                          className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white resize-none"
                          required
                        />
                      </div>

                      {/* Botón de envío */}
                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            "Enviando..."
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Enviar Mensaje
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Offices */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nuestras Oficinas</h2>
                <div className="space-y-6">
                  {oficinas.map((oficina, index) => (
                    <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <div className="flex items-start space-x-3">
                          <Building className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
                          <div>
                            <CardTitle className="text-lg text-gray-900 dark:text-white">{oficina.nombre}</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">
                              {oficina.tipo === "principal"
                                ? "Oficina Principal"
                                : oficina.tipo === "departamento"
                                  ? "Departamento Especializado"
                                  : "Oficina Regional"}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {oficina.direccion}, {oficina.ciudad}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4" />
                          <span>{oficina.telefono}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span>{oficina.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{oficina.horarios}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Síguenos en Redes Sociales</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Mantente informado sobre las últimas noticias y actualizaciones del programa nacional de vacunación.
            </p>
            <div className="flex justify-center space-x-6">
              <Button
                variant="outline"
                size="lg"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900"
              >
                <Facebook className="w-5 h-5 mr-2" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900"
              >
                <Twitter className="w-5 h-5 mr-2" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900"
              >
                <Instagram className="w-5 h-5 mr-2" />
                Instagram
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900"
              >
                <Youtube className="w-5 h-5 mr-2" />
                YouTube
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-8 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Phone className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Contacto de Emergencia</h3>
            </div>
            <p className="text-red-700 dark:text-red-400 mb-4">
              Para emergencias médicas relacionadas con vacunación, contacta inmediatamente:
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-red-600 text-white px-6 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <span className="font-semibold">Emergencias: 911</span>
                </div>
              </div>
              <div className="bg-red-600 text-white px-6 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <span className="font-semibold">Línea COVID: *462</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
