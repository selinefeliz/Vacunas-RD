"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, FileText, Bell, Shield, Users, Phone, Mail, ExternalLink, HelpCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "@/contexts/theme-context"

export default function HomePage() {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src={theme === "light" ? "/images/logo-vacunas-rd.jpeg" : "/images/logo-vacunas-rd-dark.jpeg"}
                alt="VACUNAS RD - Logo oficial"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">VACUNAS RD</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Ministerio de Salud Pública</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
              >
                Inicio
              </Link>
              <Link
                href="/agendar"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
              >
                Agendar cita
              </Link>
              <Link
                href="/centros"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
              >
                Centros
              </Link>
              <Link
                href="/mi-vacunacion"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
              >
                Mi Vacunación
              </Link>
              <Link
                href="/ayuda"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium flex items-center space-x-1 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Ayuda</span>
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Link href="/auth">
                <Button className="bg-green-600 hover:bg-green-700 text-white">Iniciar sesión / Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 border border-green-200 dark:border-green-700">
                  VACUNAS RD - República Dominicana
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                  Tu Vacunación en un solo lugar
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Consulta tu historial, agenda tu cita y mantente protegido. Acceso fácil y seguro a toda tu
                  información de vacunación.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white text-lg px-8">
                  Acceder al sistema
                </Button>
                <Link href="/centros">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Ver centros cercanos
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>+2M usuarios registrados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>100% seguro y confiable</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <Image
                src="/images/mujer-vacunada-feliz.jpeg"
                alt="Mujer feliz mostrando vendaje después de vacunarse, haciendo gesto de pulgar hacia arriba"
                width={600}
                height={500}
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Certificado Digital</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Descarga instantánea</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades Principales */}
      <section className="py-16 bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Todo lo que necesitas para tu vacunación
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Servicios diseñados para hacer tu experiencia más fácil y segura
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Agenda en línea</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                  Programa tu cita de vacunación de forma rápida y sencilla, 24/7
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Ubica tu centro</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                  Encuentra el centro de vacunación más cercano a tu ubicación
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Certificado digital</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                  Descarga tu certificado de vacunación oficial al instante
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Recordatorios</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                  Recibe notificaciones automáticas para tus próximas dosis
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sección Informativa */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Últimas noticias y campañas</h2>

              <div className="space-y-6">
                <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 mb-2 border border-red-200 dark:border-red-700">
                          Importante
                        </Badge>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">
                          Nueva campaña de vacunación contra la influenza 2024
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">Hace 2 días</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Inicia la campaña nacional de vacunación contra la influenza. Grupos prioritarios pueden agendar
                      desde hoy.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Leer más <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      Actualización del esquema de vacunación infantil
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">Hace 1 semana</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Nuevas recomendaciones para el calendario de vacunación en menores de 5 años.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Leer más <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Información importante</h3>

              <div className="space-y-4">
                <Card className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                      <div>
                        <p className="font-semibold text-blue-800 dark:text-blue-200">Vacunación segura</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Todas las vacunas son seguras y efectivas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
                      <div>
                        <p className="font-semibold text-green-800 dark:text-green-200">Documentos necesarios</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Solo necesitas tu cédula de identidad
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-1" />
                      <div>
                        <p className="font-semibold text-orange-800 dark:text-orange-200">¿Necesitas ayuda?</p>
                        <p className="text-sm text-orange-700 dark:text-orange-300">Línea gratuita: 800-VACUNA</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/images/logo-vacunas-rd-dark.jpeg"
                  alt="VACUNAS RD - Logo oficial"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-lg font-bold">VACUNAS RD</span>
              </div>
              <p className="text-gray-400 text-sm">Sistema Nacional de Vacunación del Ministerio de Salud Pública</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Enlaces útiles</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/terminos" className="text-gray-400 hover:text-white transition-colors">
                    Términos y condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/privacidad" className="text-gray-400 hover:text-white transition-colors">
                    Política de privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/contacto" className="text-gray-400 hover:text-white transition-colors">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="/preguntas" className="text-gray-400 hover:text-white transition-colors">
                    Preguntas frecuentes
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/agendar" className="text-gray-400 hover:text-white transition-colors">
                    Agendar cita
                  </Link>
                </li>
                <li>
                  <Link href="/centros" className="text-gray-400 hover:text-white transition-colors">
                    Centros de vacunación
                  </Link>
                </li>
                <li>
                  <Link href="/certificados" className="text-gray-400 hover:text-white transition-colors">
                    Certificados digitales
                  </Link>
                </li>
                <li>
                  <Link href="/historial" className="text-gray-400 hover:text-white transition-colors">
                    Historial de vacunas
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-gray-400">800-VACUNA (822-862)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-gray-400">info@vacunasegura.gob</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">© 2024 Ministerio de Salud. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
