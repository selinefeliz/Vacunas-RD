"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Search,
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
  Filter,
  Navigation,
  Star,
  Users,
  ShipWheelIcon as Wheelchair,
  Car,
  Wifi,
  AirVent,
  Shield,
  Calendar,
  ExternalLink,
  MapIcon,
  List,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "@/contexts/theme-context"
import { useState, useCallback } from "react"
import InteractiveMap from "@/components/interactive-map"

export default function CentrosPage() {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("todas")
  const [selectedType, setSelectedType] = useState("todos")
  const [showMap, setShowMap] = useState(true)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedCentro, setSelectedCentro] = useState<number | null>(null)

  const centros = [
    {
      id: 1,
      name: "Centro Nacional de Vacunación",
      address: "Av. Tiradentes #34, Ensanche Naco",
      city: "Santo Domingo",
      province: "Distrito Nacional",
      phone: "(809) 686-9140",
      email: "centro.nacional@salud.gob.do",
      hours: {
        weekdays: "7:00 AM - 5:00 PM",
        saturday: "8:00 AM - 2:00 PM",
        sunday: "Cerrado",
      },
      type: "hospital",
      rating: 4.8,
      reviews: 245,
      services: ["covid", "influenza", "infantil", "adultos", "viajeros"],
      features: ["parking", "wheelchair", "wifi", "ac"],
      waitTime: "15-30 min",
      coordinates: { lat: 18.4861, lng: -69.9312 },
      image: "/images/hospital-nacional.png",
      description: "Centro principal de vacunación con todas las vacunas disponibles y atención especializada.",
      capacity: "Alta",
      appointments: true,
    },
    {
      id: 2,
      name: "Hospital Dr. Salvador B. Gautier",
      address: "Av. Tiradentes #31, Ensanche Naco",
      city: "Santo Domingo",
      province: "Distrito Nacional",
      phone: "(809) 688-4411",
      email: "vacunas.gautier@salud.gob.do",
      hours: {
        weekdays: "6:00 AM - 6:00 PM",
        saturday: "7:00 AM - 3:00 PM",
        sunday: "8:00 AM - 12:00 PM",
      },
      type: "hospital",
      rating: 4.6,
      reviews: 189,
      services: ["covid", "influenza", "infantil", "adultos"],
      features: ["parking", "wheelchair", "ac"],
      waitTime: "20-40 min",
      coordinates: { lat: 18.4756, lng: -69.9312 },
      image: "/images/hospital-gautier.png",
      description: "Hospital público con servicio de vacunación integral para toda la familia.",
      capacity: "Alta",
      appointments: true,
    },
    {
      id: 3,
      name: "Centro de Salud Villa Mella",
      address: "Calle Principal #45, Villa Mella",
      city: "Villa Mella",
      province: "Santo Domingo",
      phone: "(809) 567-8901",
      email: "villa.mella@salud.gob.do",
      hours: {
        weekdays: "7:00 AM - 4:00 PM",
        saturday: "8:00 AM - 1:00 PM",
        sunday: "Cerrado",
      },
      type: "centro_salud",
      rating: 4.3,
      reviews: 98,
      services: ["covid", "influenza", "infantil"],
      features: ["parking", "wheelchair"],
      waitTime: "10-25 min",
      coordinates: { lat: 18.5204, lng: -69.8991 },
      image: "/images/centro-villa-mella.png",
      description: "Centro comunitario de salud con enfoque en atención primaria y vacunación.",
      capacity: "Media",
      appointments: false,
    },
    {
      id: 4,
      name: "Hospital Regional Universitario José María Cabral y Báez",
      address: "Av. Bartolomé Colón, Santiago",
      city: "Santiago",
      province: "Santiago",
      phone: "(809) 583-4411",
      email: "vacunas.santiago@salud.gob.do",
      hours: {
        weekdays: "6:00 AM - 6:00 PM",
        saturday: "7:00 AM - 4:00 PM",
        sunday: "8:00 AM - 1:00 PM",
      },
      type: "hospital",
      rating: 4.7,
      reviews: 156,
      services: ["covid", "influenza", "infantil", "adultos", "viajeros"],
      features: ["parking", "wheelchair", "wifi", "ac"],
      waitTime: "15-35 min",
      coordinates: { lat: 19.4517, lng: -70.697 },
      image: "/images/hospital-santiago.png",
      description: "Principal hospital de la región norte con servicios completos de vacunación.",
      capacity: "Alta",
      appointments: true,
    },
    {
      id: 5,
      name: "Clínica Familiar La Vega",
      address: "Calle Sánchez #78, Centro",
      city: "La Vega",
      province: "La Vega",
      phone: "(809) 573-2234",
      email: "lavega@salud.gob.do",
      hours: {
        weekdays: "7:00 AM - 5:00 PM",
        saturday: "8:00 AM - 2:00 PM",
        sunday: "Cerrado",
      },
      type: "clinica",
      rating: 4.4,
      reviews: 87,
      services: ["covid", "influenza", "infantil", "adultos"],
      features: ["parking", "wheelchair", "wifi"],
      waitTime: "10-20 min",
      coordinates: { lat: 19.2234, lng: -70.5287 },
      image: "/images/clinica-la-vega.png",
      description: "Clínica familiar con atención personalizada y tiempos de espera reducidos.",
      capacity: "Media",
      appointments: true,
    },
    {
      id: 6,
      name: "Centro Móvil Plaza Central",
      address: "Plaza Central, Av. 27 de Febrero",
      city: "Santo Domingo",
      province: "Distrito Nacional",
      phone: "(809) 200-MOVIL",
      email: "movil.central@salud.gob.do",
      hours: {
        weekdays: "9:00 AM - 6:00 PM",
        saturday: "9:00 AM - 4:00 PM",
        sunday: "10:00 AM - 2:00 PM",
      },
      type: "movil",
      rating: 4.2,
      reviews: 134,
      services: ["covid", "influenza"],
      features: ["wheelchair", "ac"],
      waitTime: "5-15 min",
      coordinates: { lat: 18.4896, lng: -69.9018 },
      image: "/images/centro-movil.png",
      description: "Unidad móvil ubicada estratégicamente para fácil acceso y atención rápida.",
      capacity: "Baja",
      appointments: false,
    },
  ]

  const provinces = [
    { value: "todas", label: "Todas las provincias" },
    { value: "Distrito Nacional", label: "Distrito Nacional" },
    { value: "Santo Domingo", label: "Santo Domingo" },
    { value: "Santiago", label: "Santiago" },
    { value: "La Vega", label: "La Vega" },
    { value: "San Cristóbal", label: "San Cristóbal" },
    { value: "Puerto Plata", label: "Puerto Plata" },
  ]

  const centerTypes = [
    { value: "todos", label: "Todos los tipos" },
    { value: "hospital", label: "Hospitales" },
    { value: "centro_salud", label: "Centros de Salud" },
    { value: "clinica", label: "Clínicas" },
    { value: "movil", label: "Unidades Móviles" },
  ]

  const availableServices = [
    { id: "covid", label: "COVID-19", color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300" },
    { id: "influenza", label: "Influenza", color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300" },
    {
      id: "infantil",
      label: "Vacunas Infantiles",
      color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300",
    },
    {
      id: "adultos",
      label: "Vacunas Adultos",
      color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300",
    },
    {
      id: "viajeros",
      label: "Vacunas Viajeros",
      color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300",
    },
  ]

  const filteredCentros = centros.filter((centro) => {
    const matchesSearch =
      centro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      centro.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      centro.city.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesProvince = selectedProvince === "todas" || centro.province === selectedProvince
    const matchesType = selectedType === "todos" || centro.type === selectedType
    const matchesServices =
      selectedServices.length === 0 || selectedServices.some((service) => centro.services.includes(service))

    return matchesSearch && matchesProvince && matchesType && matchesServices
  })

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "hospital":
        return "Hospital"
      case "centro_salud":
        return "Centro de Salud"
      case "clinica":
        return "Clínica"
      case "movil":
        return "Unidad Móvil"
      default:
        return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "hospital":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700"
      case "centro_salud":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700"
      case "clinica":
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700"
      case "movil":
        return "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700"
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"
    }
  }

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case "parking":
        return <Car className="w-4 h-4" />
      case "wheelchair":
        return <Wheelchair className="w-4 h-4" />
      case "wifi":
        return <Wifi className="w-4 h-4" />
      case "ac":
        return <AirVent className="w-4 h-4" />
      default:
        return null
    }
  }

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const handleCentroSelect = useCallback((centroId: number) => {
    setSelectedCentro(centroId)
  }, [])

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
              <MapPin className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Centros de Vacunación</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Encuentra el centro de vacunación más cercano a tu ubicación con toda la información que necesitas
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre o dirección..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-green-500"
                  />
                </div>

                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                    {provinces.map((province) => (
                      <SelectItem
                        key={province.value}
                        value={province.value}
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {province.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                    {centerTypes.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={showMap ? "default" : "outline"}
                    onClick={() => setShowMap(!showMap)}
                    className={
                      showMap ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-300 dark:border-gray-600"
                    }
                  >
                    {showMap ? <List className="w-4 h-4 mr-2" /> : <MapIcon className="w-4 h-4 mr-2" />}
                    {showMap ? "Lista" : "Mapa"}
                  </Button>
                </div>
              </div>

              {/* Service Filters */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Filtrar por servicios:
                </Label>
                <div className="flex flex-wrap gap-3">
                  {availableServices.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                        className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-green-600"
                      />
                      <Label htmlFor={service.id} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        {service.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      {showMap && (
        <section className="py-8 bg-white dark:bg-gray-900 transition-colors duration-300">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Mapa de Centros ({filteredCentros.length})
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Hospitales</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Centros de Salud</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Clínicas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>Unidades Móviles</span>
                  </div>
                </div>
              </div>
              <InteractiveMap
                centros={filteredCentros}
                selectedCentro={selectedCentro}
                onCentroSelect={handleCentroSelect}
              />
            </div>
          </div>
        </section>
      )}

      {/* Centers List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Centros Disponibles ({filteredCentros.length})
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Filter className="w-4 h-4" />
                <span>Ordenar por distancia</span>
              </div>
            </div>

            {filteredCentros.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No se encontraron centros</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Intenta ajustar los filtros de búsqueda para encontrar centros en tu área.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredCentros.map((centro) => (
                  <Card
                    key={centro.id}
                    className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
                      selectedCentro === centro.id ? "ring-2 ring-green-500 shadow-lg" : ""
                    }`}
                    onClick={() => setSelectedCentro(centro.id)}
                  >
                    <div className="md:flex">
                      <div className="md:w-1/4">
                        <Image
                          src={centro.image || "/placeholder.svg"}
                          alt={centro.name}
                          width={300}
                          height={200}
                          className="w-full h-48 md:h-full object-cover"
                        />
                      </div>
                      <div className="md:w-3/4 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getTypeColor(centro.type)}>{getTypeLabel(centro.type)}</Badge>
                              {centro.appointments && (
                                <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Citas disponibles
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{centro.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>
                                  {centro.address}, {centro.city}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span>{centro.rating}</span>
                                <span>({centro.reviews} reseñas)</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Espera: {centro.waitTime}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">{centro.description}</p>
                          </div>
                        </div>

                        {/* Services */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Servicios disponibles:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {centro.services.map((service) => {
                              const serviceInfo = availableServices.find((s) => s.id === service)
                              return (
                                <Badge
                                  key={service}
                                  className={
                                    serviceInfo?.color ||
                                    "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300"
                                  }
                                >
                                  {serviceInfo?.label || service}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>

                        {/* Features */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Facilidades:</h4>
                          <div className="flex items-center space-x-4">
                            {centro.features.map((feature) => (
                              <div
                                key={feature}
                                className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400"
                              >
                                {getFeatureIcon(feature)}
                                <span className="capitalize">
                                  {feature === "parking"
                                    ? "Estacionamiento"
                                    : feature === "wheelchair"
                                      ? "Accesible"
                                      : feature === "wifi"
                                        ? "WiFi"
                                        : feature === "ac"
                                          ? "A/C"
                                          : feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Hours */}
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Horarios de atención:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              <span className="font-medium">Lun-Vie:</span> {centro.hours.weekdays}
                            </div>
                            <div>
                              <span className="font-medium">Sábado:</span> {centro.hours.saturday}
                            </div>
                            <div>
                              <span className="font-medium">Domingo:</span> {centro.hours.sunday}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          {centro.appointments && (
                            <Link href="/agendar">
                              <Button className="bg-green-600 hover:bg-green-700 text-white">
                                <Calendar className="w-4 h-4 mr-2" />
                                Agendar Cita
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="outline"
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            <Navigation className="w-4 h-4 mr-2" />
                            Cómo llegar
                          </Button>
                          <Button
                            variant="outline"
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            {centro.phone}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Más info
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Red Nacional de Vacunación
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">150+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Centros Activos</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">2M+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Personas Vacunadas</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">15</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tipos de Vacunas</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Soporte Disponible</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Info */}
      <section className="py-8 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                ¿Necesitas vacunarte urgentemente?
              </h3>
            </div>
            <p className="text-blue-700 dark:text-blue-400 mb-4">
              Llama a nuestra línea de emergencia para ubicar el centro más cercano con disponibilidad inmediata.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-blue-600 text-white px-4 py-2">
                <Phone className="w-4 h-4 mr-2" />
                Emergencias: 800-VACUNA
              </Badge>
              <Badge className="bg-blue-600 text-white px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                Disponible 24/7
              </Badge>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
