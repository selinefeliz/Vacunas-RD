"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Shield,
  Target,
  Users,
  Award,
  TrendingUp,
  Globe,
  Heart,
  CheckCircle,
  Calendar,
  MapPin,
  Stethoscope,
  BookOpen,
  Lightbulb,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "@/contexts/theme-context"

export default function AcercaDePage() {
  const { theme } = useTheme()

  const estadisticas = [
    {
      numero: "2.5M+",
      descripcion: "Ciudadanos Vacunados",
      icono: Users,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      numero: "150+",
      descripcion: "Centros de Vacunación",
      icono: MapPin,
      color: "text-green-600 dark:text-green-400",
    },
    {
      numero: "95%",
      descripcion: "Cobertura Nacional",
      icono: Globe,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      numero: "15",
      descripcion: "Tipos de Vacunas",
      icono: Stethoscope,
      color: "text-orange-600 dark:text-orange-400",
    },
  ]

  const objetivos = [
    {
      titulo: "Cobertura Universal",
      descripcion: "Garantizar acceso gratuito a vacunas para todos los ciudadanos dominicanos.",
      icono: Globe,
    },
    {
      titulo: "Prevención de Enfermedades",
      descripcion: "Reducir la incidencia de enfermedades prevenibles mediante vacunación.",
      icono: Shield,
    },
    {
      titulo: "Educación Sanitaria",
      descripcion: "Promover la importancia de la vacunación a través de campañas educativas.",
      icono: BookOpen,
    },
    {
      titulo: "Innovación Tecnológica",
      descripcion: "Implementar tecnologías modernas para mejorar la gestión de vacunas.",
      icono: Lightbulb,
    },
  ]

  const logros = [
    {
      año: "2024",
      titulo: "Certificación Digital Internacional",
      descripcion: "Implementación de certificados digitales reconocidos internacionalmente.",
    },
    {
      año: "2023",
      titulo: "Cobertura del 95%",
      descripcion: "Alcanzamos una cobertura nacional del 95% en vacunación infantil.",
    },
    {
      año: "2022",
      titulo: "Sistema Digital Integrado",
      descripcion: "Lanzamiento de la plataforma digital VACUNAS RD.",
    },
    {
      año: "2021",
      titulo: "Campaña COVID-19",
      descripcion: "Exitosa campaña de vacunación contra COVID-19 a nivel nacional.",
    },
  ]

  const equipo = [
    {
      nombre: "Dr. María González",
      cargo: "Directora Nacional de Inmunizaciones",
      descripcion: "Especialista en epidemiología con 15 años de experiencia en salud pública.",
    },
    {
      nombre: "Dr. Carlos Rodríguez",
      cargo: "Coordinador de Programas de Vacunación",
      descripcion: "Médico pediatra especializado en inmunología y vacunas.",
    },
    {
      nombre: "Ing. Ana Martínez",
      cargo: "Directora de Tecnología",
      descripcion: "Ingeniera en sistemas especializada en soluciones de salud digital.",
    },
    {
      nombre: "Lic. Pedro Jiménez",
      cargo: "Coordinador de Comunicaciones",
      descripcion: "Especialista en comunicación social y campañas de salud pública.",
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
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Acerca de VACUNAS RD</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Conoce más sobre el Sistema Nacional de Vacunación de República Dominicana, nuestro compromiso con la
              salud pública y los logros alcanzados en la protección de nuestra población.
            </p>
          </div>
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-2xl text-gray-900 dark:text-white">Nuestra Misión</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    Garantizar el acceso universal, gratuito y oportuno a las vacunas para toda la población dominicana,
                    contribuyendo a la prevención de enfermedades inmunoprevenibles y promoviendo la salud pública a
                    través de un sistema integrado, eficiente y de calidad.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                    <CardTitle className="text-2xl text-gray-900 dark:text-white">Nuestra Visión</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    Ser reconocidos como el sistema de vacunación más avanzado y confiable de la región, líder en
                    innovación tecnológica y excelencia en la prestación de servicios de inmunización, contribuyendo
                    significativamente a la salud y bienestar de la población dominicana.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12 text-center">
              Nuestro Impacto en Números
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {estadisticas.map((stat, index) => (
                <Card
                  key={index}
                  className="text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="p-6">
                    <stat.icono className={`w-12 h-12 ${stat.color} mx-auto mb-4`} />
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.numero}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.descripcion}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12 text-center">
              Nuestros Objetivos Estratégicos
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {objetivos.map((objetivo, index) => (
                <Card key={index} className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <objetivo.icono className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <CardTitle className="text-xl text-gray-900 dark:text-white">{objetivo.titulo}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">{objetivo.descripcion}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline of Achievements */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12 text-center">
              Nuestros Logros Recientes
            </h2>
            <div className="space-y-8">
              {logros.map((logro, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <Card className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                          {logro.año}
                        </Badge>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">{logro.titulo}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300">{logro.descripcion}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12 text-center">Nuestro Equipo</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {equipo.map((miembro, index) => (
                <Card
                  key={index}
                  className="text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <CardHeader>
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">{miembro.nombre}</CardTitle>
                    <CardDescription className="text-blue-600 dark:text-blue-400 font-medium">
                      {miembro.cargo}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{miembro.descripcion}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12 text-center">Nuestros Valores</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <CardTitle className="text-xl text-gray-900 dark:text-white">Excelencia</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Comprometidos con la calidad y mejora continua en todos nuestros servicios.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <Heart className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                  <CardTitle className="text-xl text-gray-900 dark:text-white">Compromiso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Dedicados a proteger la salud de todos los ciudadanos dominicanos.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <CardTitle className="text-xl text-gray-900 dark:text-white">Innovación</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Adoptamos tecnologías avanzadas para mejorar nuestros servicios continuamente.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Únete a Nuestra Misión</h2>
            <p className="text-xl mb-8 opacity-90">
              Juntos podemos construir una República Dominicana más saludable y protegida. Tu participación es
              fundamental para el éxito de nuestro programa nacional de vacunación.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/agendar">
                <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                  <Calendar className="w-5 h-5 mr-2" />
                  Agenda tu Vacuna
                </Button>
              </Link>
              <Link href="/centros">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-green-600"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Encuentra tu Centro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
