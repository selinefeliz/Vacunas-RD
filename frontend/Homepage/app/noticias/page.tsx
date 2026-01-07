"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Clock,
  ArrowLeft,
  Filter,
  ExternalLink,
  Share2,
  Bookmark,
  Eye,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "@/contexts/theme-context"
import { useState } from "react"

export default function NoticiasPage() {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("todas")

  const noticias = [
    {
      id: 1,
      title: "Nueva campaña de vacunación contra la influenza 2024",
      excerpt:
        "Inicia la campaña nacional de vacunación contra la influenza. Grupos prioritarios pueden agendar desde hoy.",
      content:
        "El Ministerio de Salud Pública anuncia el inicio de la campaña nacional de vacunación contra la influenza estacional 2024. Esta campaña está dirigida prioritariamente a adultos mayores de 60 años, embarazadas, niños de 6 meses a 5 años, y personas con condiciones crónicas como diabetes, hipertensión y enfermedades respiratorias.",
      category: "campañas",
      date: "2024-06-13",
      author: "Ministerio de Salud Pública",
      readTime: "3 min",
      views: 1250,
      image: "/images/mujer-vacunada-feliz.jpeg",
      priority: "alta",
      tags: ["influenza", "campaña", "grupos prioritarios"],
    },
    {
      id: 2,
      title: "Actualización del esquema de vacunación infantil",
      excerpt: "Nuevas recomendaciones para el calendario de vacunación en menores de 5 años.",
      content:
        "Se han actualizado las recomendaciones del esquema nacional de vacunación para menores de 5 años, incluyendo nuevas dosis de refuerzo y la incorporación de vacunas contra el rotavirus y neumococo. Los padres deben consultar con su pediatra para actualizar el carnet de vacunación de sus hijos.",
      category: "actualizaciones",
      date: "2024-06-08",
      author: "Dirección de Inmunizaciones",
      readTime: "5 min",
      views: 890,
      image: "/images/mujer-vacunada-feliz.jpeg",
      priority: "media",
      tags: ["infantil", "esquema", "actualización"],
    },
    {
      id: 3,
      title: "Nuevos centros de vacunación en Santiago y La Vega",
      excerpt: "Se inauguran 5 nuevos centros de vacunación para mejorar la cobertura en el interior del país.",
      content:
        "Como parte del plan de expansión de la red de vacunación, se han inaugurado 5 nuevos centros en las provincias de Santiago y La Vega. Estos centros cuentan con tecnología de punta y personal especializado para garantizar un servicio de calidad a la población.",
      category: "infraestructura",
      date: "2024-06-05",
      author: "Dirección Regional de Salud",
      readTime: "4 min",
      views: 567,
      image: "/images/mujer-vacunada-feliz.jpeg",
      priority: "media",
      tags: ["centros", "santiago", "la vega"],
    },
    {
      id: 4,
      title: "Certificados digitales ahora disponibles en inglés",
      excerpt:
        "Los certificados de vacunación digital ahora se pueden generar en español e inglés para facilitar los viajes.",
      content:
        "A partir de esta semana, los ciudadanos pueden descargar sus certificados de vacunación en formato bilingüe (español-inglés). Esta mejora facilitará los trámites de viaje y cumple con los estándares internacionales de documentación sanitaria.",
      category: "tecnologia",
      date: "2024-06-01",
      author: "Dirección de Tecnología",
      readTime: "2 min",
      views: 1100,
      image: "/images/mujer-vacunada-feliz.jpeg",
      priority: "baja",
      tags: ["certificados", "inglés", "viajes"],
    },
    {
      id: 5,
      title: "Jornada especial de vacunación en centros comerciales",
      excerpt:
        "Durante el fin de semana se realizarán jornadas especiales en principales centros comerciales del país.",
      content:
        "Con el objetivo de facilitar el acceso a la vacunación, se realizarán jornadas especiales en los principales centros comerciales de Santo Domingo, Santiago y San Pedro de Macorís. Las jornadas serán de 9:00 AM a 6:00 PM durante todo el fin de semana.",
      category: "eventos",
      date: "2024-05-28",
      author: "Coordinación Nacional",
      readTime: "3 min",
      views: 750,
      image: "/images/mujer-vacunada-feliz.jpeg",
      priority: "alta",
      tags: ["jornada", "centros comerciales", "fin de semana"],
    },
    {
      id: 6,
      title: "Estudio confirma efectividad de vacunas aplicadas en RD",
      excerpt: "Investigación nacional demuestra alta efectividad de las vacunas del esquema nacional de inmunización.",
      content:
        "Un estudio realizado por el Instituto Nacional de Salud confirma que las vacunas aplicadas en República Dominicana mantienen una efectividad superior al 95% en la prevención de enfermedades. El estudio analizó datos de los últimos 3 años y confirma la calidad del programa nacional de inmunización.",
      category: "estudios",
      date: "2024-05-25",
      author: "Instituto Nacional de Salud",
      readTime: "6 min",
      views: 432,
      image: "/images/mujer-vacunada-feliz.jpeg",
      priority: "media",
      tags: ["estudio", "efectividad", "investigación"],
    },
  ]

  const categories = [
    { value: "todas", label: "Todas las categorías" },
    { value: "campañas", label: "Campañas" },
    { value: "actualizaciones", label: "Actualizaciones" },
    { value: "infraestructura", label: "Infraestructura" },
    { value: "tecnologia", label: "Tecnología" },
    { value: "eventos", label: "Eventos" },
    { value: "estudios", label: "Estudios" },
  ]

  const filteredNoticias = noticias.filter((noticia) => {
    const matchesSearch =
      noticia.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      noticia.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      noticia.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "todas" || noticia.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "alta":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "media":
        return <Info className="w-4 h-4 text-yellow-500" />
      case "baja":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700"
      case "media":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700"
      case "baja":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700"
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"
    }
  }

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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Noticias y Actualizaciones
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Mantente informado sobre las últimas noticias, campañas y actualizaciones del sistema nacional de
              vacunación
            </p>
          </div>

          {/* Filters */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar noticias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-green-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                    {categories.map((category) => (
                      <SelectItem
                        key={category.value}
                        value={category.value}
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured News */}
      {filteredNoticias.length > 0 && (
        <section className="py-8 bg-white dark:bg-gray-900 transition-colors duration-300">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Noticia Destacada</h2>
              </div>

              <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <Image
                      src={filteredNoticias[0].image || "/placeholder.svg"}
                      alt={filteredNoticias[0].title}
                      width={400}
                      height={250}
                      className="w-full h-48 md:h-full object-cover"
                    />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      {getPriorityIcon(filteredNoticias[0].priority)}
                      <Badge className={getPriorityColor(filteredNoticias[0].priority)}>
                        {filteredNoticias[0].category.charAt(0).toUpperCase() + filteredNoticias[0].category.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(filteredNoticias[0].date).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {filteredNoticias[0].title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                      {filteredNoticias[0].content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{filteredNoticias[0].readTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{filteredNoticias[0].views} vistas</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                          <Share2 className="w-4 h-4 mr-2" />
                          Compartir
                        </Button>
                        <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                          <Bookmark className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* News Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
              Todas las Noticias ({filteredNoticias.length})
            </h2>

            {filteredNoticias.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No se encontraron noticias</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Intenta con otros términos de búsqueda o cambia el filtro de categoría.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNoticias.slice(1).map((noticia) => (
                  <Card
                    key={noticia.id}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <div className="relative">
                      <Image
                        src={noticia.image || "/placeholder.svg"}
                        alt={noticia.title}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className={getPriorityColor(noticia.priority)}>
                          {noticia.category.charAt(0).toUpperCase() + noticia.category.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <div className="flex items-center space-x-2 mb-2">
                        {getPriorityIcon(noticia.priority)}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(noticia.date).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white line-clamp-2">
                        {noticia.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                        {noticia.excerpt}
                      </CardDescription>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{noticia.readTime}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{noticia.views}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          Leer más
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" className="p-1">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1">
                            <Bookmark className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mantente Informado</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Suscríbete a nuestro boletín para recibir las últimas noticias y actualizaciones directamente en tu email.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Tu correo electrónico"
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-green-500"
              />
              <Button className="bg-green-600 hover:bg-green-700 text-white">Suscribirse</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
