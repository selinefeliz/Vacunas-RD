"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { MapPin, List, Filter, Search, X, Building, Syringe, Stethoscope, Clock, Phone, Mail } from 'lucide-react';
import InteractiveMap from '@/components/interactive-map';

// Define interfaces for data structures
interface Centro {
  id: string;
  nombre: string;
  direccion: string;
  provincia: string;
  municipio: string;
  tipo: string; // e.g., Hospital, Clínica, Centro de Salud Primaria
  horarios: string;
  telefono?: string;
  email?: string;
  servicios: Servicio[];
  coordenadas?: { lat: number; lng: number };
  accesibilidad?: string[];
  notas?: string;
}

interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface SelectOption {
  value: string;
  label: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CentrosPage() {
  const [centrosData, setCentrosData] = useState<Centro[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');

  // UI State
  const [showMap, setShowMap] = useState<boolean>(false); // Default to list view
  const [selectedCentro, setSelectedCentro] = useState<Centro | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Mock data for provinces, types, services for filters - replace with API data if available
  const provinces: SelectOption[] = [
    { value: '__ALL__', label: 'Todas las Provincias' },
    { value: 'Santo Domingo', label: 'Santo Domingo' },
    { value: 'Santiago', label: 'Santiago' },
    { value: 'Distrito Nacional', label: 'Distrito Nacional' },
    // Add more provinces
  ];

  const centerTypes: SelectOption[] = [
    { value: '__ALL__', label: 'Todos los Tipos' },
    { value: 'Hospital', label: 'Hospital' },
    { value: 'Clínica', label: 'Clínica' },
    { value: 'Centro de Salud Primaria', label: 'Centro de Salud Primaria' },
    // Add more types
  ];

  const services: SelectOption[] = [
    { value: '__ALL__', label: 'Todos los Servicios' },
    { value: 'Vacunación COVID-19', label: 'Vacunación COVID-19' },
    { value: 'Vacunación Influenza', label: 'Vacunación Influenza' },
    { value: 'Vacunación Pediátrica', label: 'Vacunación Pediátrica' },
    // Add more services
  ];

  useEffect(() => {
    const fetchCentros = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // const response = await fetch(`${API_URL}/centros`);
        // if (!response.ok) {
        //   throw new Error(`HTTP error! status: ${response.status}`);
        // }
        // const data = await response.json();
        // MOCK DATA until API is ready
        const mockData: Centro[] = [
          {
            id: '1',
            nombre: 'Hospital General Plaza de la Salud',
            direccion: 'Av. Ortega y Gasset, Santo Domingo',
            provincia: 'Distrito Nacional',
            municipio: 'Distrito Nacional',
            tipo: 'Hospital',
            horarios: 'L-V 8am-5pm, S 8am-12pm',
            telefono: '809-565-7477',
            email: 'info@hgps.org.do',
            servicios: [{ id: 's1', nombre: 'Vacunación COVID-19' }, { id: 's2', nombre: 'Vacunación Influenza' }],
            coordenadas: { lat: 18.4719, lng: -69.9409 }
          },
          {
            id: '2',
            nombre: 'CEDIMAT',
            direccion: 'Plaza de la Salud Dr. Juan Manuel Taveras Rodriguez, Santo Domingo',
            provincia: 'Distrito Nacional',
            municipio: 'Distrito Nacional',
            tipo: 'Clínica',
            horarios: 'L-V 7am-6pm',
            telefono: '809-565-9989',
            email: 'info@cedimat.com',
            servicios: [{ id: 's1', nombre: 'Vacunación COVID-19' }, { id: 's3', nombre: 'Vacunación Pediátrica' }],
            coordenadas: { lat: 18.4731, lng: -69.9386 }
          },
          {
            id: '3',
            nombre: 'Centro de Vacunación Santiago Centro',
            direccion: 'Calle Sol #123, Santiago',
            provincia: 'Santiago',
            municipio: 'Santiago de los Caballeros',
            tipo: 'Centro de Salud Primaria',
            horarios: 'L-S 8am-4pm',
            telefono: '809-123-4567',
            servicios: [{ id: 's1', nombre: 'Vacunación COVID-19' }],
            coordenadas: { lat: 19.4500, lng: -70.7000 }
          }
        ];
        setCentrosData(mockData);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Ocurrió un error desconocido');
        }
        setCentrosData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCentros();
  }, []);

  const filteredCentros = useMemo(() => {
    return centrosData.filter(centro => {
      return (
        (searchTerm === '' ||
          centro.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          centro.direccion.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedProvince === '' || selectedProvince === '__ALL__' || centro.provincia === selectedProvince) &&
        (selectedType === '' || selectedType === '__ALL__' || centro.tipo === selectedType) &&
        (selectedService === '' || selectedService === '__ALL__' || centro.servicios.some(s => s.nombre === selectedService))
      );
    });
  }, [centrosData, searchTerm, selectedProvince, selectedType, selectedService]);

  const handleOpenModal = (centro: Centro) => {
    setSelectedCentro(centro);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCentro(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p className="text-xl text-gray-600 dark:text-gray-300">Cargando centros de vacunación...</p>
        {/* Consider adding a spinner component here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-[calc(100vh-200px)]">
        <p className="text-xl text-red-600 dark:text-red-400">Error: {error}</p>
        <p className="text-gray-600 dark:text-gray-300 mt-2">No se pudieron cargar los datos. Por favor, intente más tarde.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Centros de Vacunación</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Encuentra el centro más cercano y conveniente para ti.</p>
      </header>

      {/* Filters Section */}
      <section className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
            <div className="relative">
              <Input
                type="text"
                id="search"
                placeholder="Nombre o dirección..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provincia</label>
            <Select value={selectedProvince} onValueChange={(value: string) => setSelectedProvince(value)}>
              <SelectTrigger id="province">
                <SelectValue placeholder="Seleccionar provincia" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((option: SelectOption) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Centro</label>
            <Select value={selectedType} onValueChange={(value: string) => setSelectedType(value)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {centerTypes.map((option: SelectOption) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="service" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Servicio</label>
            <Select value={selectedService} onValueChange={(value: string) => setSelectedService(value)}>
              <SelectTrigger id="service">
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((option: SelectOption) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Map/List Toggle and Content Area */}
      <section className="mb-8">
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={() => setShowMap(!showMap)} className="flex items-center gap-2">
            {showMap ? <List className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
            {showMap ? 'Ver Lista' : 'Ver Mapa'}
          </Button>
        </div>

        {showMap ? (
          <div className="h-[500px] md:h-[600px] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-lg">
            <InteractiveMap
              centros={filteredCentros}
              selectedCentroId={selectedCentro?.id}
              onCentroSelect={(id) => {
                const centro = filteredCentros.find(c => c.id === id);
                if (centro) handleOpenModal(centro);
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCentros.length > 0 ? (
              filteredCentros.map((centro: Centro) => (
                <Card key={centro.id} className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800 border dark:border-gray-700" onClick={() => handleOpenModal(centro)}>
                  <CardHeader>
                    <CardTitle className="text-xl text-green-600 dark:text-green-400 flex items-center gap-2">
                      <Building className="w-6 h-6" /> {centro.nombre}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 pt-1">
                      <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" /> {centro.direccion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><strong className="font-medium">Tipo:</strong> {centro.tipo}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><strong className="font-medium">Provincia:</strong> {centro.provincia}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3"><strong className="font-medium">Horarios:</strong> {centro.horarios}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {centro.servicios.map((servicio: Servicio) => (
                        <span key={servicio.id} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300 flex items-center gap-1">
                          <Syringe className="w-3 h-3" /> {servicio.nombre}
                        </span>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-2" onClick={(e) => { e.stopPropagation(); handleOpenModal(centro); }}>
                      Ver Detalles
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Search className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-xl text-gray-600 dark:text-gray-300">No se encontraron centros con los filtros aplicados.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Intenta ajustar tu búsqueda o filtros.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal for Centro Details */}
      {selectedCentro && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 border dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-2xl text-green-600 dark:text-green-400 flex items-center gap-2">
                <Building className="w-7 h-7" /> {selectedCentro.nombre}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 pt-1 text-gray-500 dark:text-gray-400">
                <MapPin className="w-4 h-4" /> {selectedCentro.direccion}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p><strong className="font-medium text-gray-800 dark:text-gray-100">Provincia:</strong> {selectedCentro.provincia}</p>
              <p><strong className="font-medium text-gray-800 dark:text-gray-100">Municipio:</strong> {selectedCentro.municipio}</p>
              <p><strong className="font-medium text-gray-800 dark:text-gray-100">Tipo de Centro:</strong> {selectedCentro.tipo}</p>
              <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" /> <strong className="font-medium text-gray-800 dark:text-gray-100">Horarios:</strong> {selectedCentro.horarios}</p>
              {selectedCentro.telefono &&
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" /> <strong className="font-medium text-gray-800 dark:text-gray-100">Teléfono:</strong> <a href={`tel:${selectedCentro.telefono}`} className="text-blue-600 hover:underline dark:text-blue-400">{selectedCentro.telefono}</a></p>}
              {selectedCentro.email &&
                <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" /> <strong className="font-medium text-gray-800 dark:text-gray-100">Email:</strong> <a href={`mailto:${selectedCentro.email}`} className="text-blue-600 hover:underline dark:text-blue-400">{selectedCentro.email}</a></p>}

              <div>
                <strong className="font-medium text-gray-800 dark:text-gray-100">Servicios Disponibles:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 pl-2">
                  {selectedCentro.servicios.map((servicio: Servicio) => (
                    <li key={servicio.id} className="flex items-center gap-2">
                      <Syringe className="w-4 h-4 text-green-500" /> {servicio.nombre}
                      {servicio.descripcion && <span className="text-xs text-gray-500 dark:text-gray-400">- {servicio.descripcion}</span>}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedCentro.accesibilidad && selectedCentro.accesibilidad.length > 0 && (
                <div>
                  <strong className="font-medium text-gray-800 dark:text-gray-100">Accesibilidad:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1 pl-2">
                    {selectedCentro.accesibilidad.map((feature: string, index: number) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCentro.notas && (
                <div>
                  <strong className="font-medium text-gray-800 dark:text-gray-100">Notas Adicionales:</strong>
                  <p className="mt-1 whitespace-pre-wrap">{selectedCentro.notas}</p>
                </div>
              )}
            </div>

            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cerrar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

