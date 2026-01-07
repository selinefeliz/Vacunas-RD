"use client"

import { useEffect, useState, useRef, useCallback } from "react"

interface Centro {
  id: number
  name: string
  address: string
  city: string
  province: string
  phone: string
  type: string
  coordinates: { lat: number; lng: number }
  services: string[]
  waitTime: string
  appointments: boolean
  rating: number
}

interface InteractiveMapProps {
  centros: Centro[]
  selectedCentro?: number | null
  onCentroSelect?: (centroId: number) => void
}

export default function InteractiveMap({ centros, selectedCentro, onCentroSelect }: InteractiveMapProps) {
  const [map, setMap] = useState<any>(null)
  const [L, setL] = useState<any>(null)
  const markersRef = useRef<any[]>([])
  const mapRef = useRef<any>(null)

  // Memoizar la función de callback para evitar recreaciones
  const handleCentroSelect = useCallback(
    (centroId: number) => {
      if (onCentroSelect) {
        onCentroSelect(centroId)
      }
    },
    [onCentroSelect],
  )

  // Cargar Leaflet una sola vez
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== "undefined" && !L) {
        try {
          const leaflet = await import("leaflet")
          setL(leaflet.default)

          // Configurar iconos por defecto
          delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl
          leaflet.default.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          })
        } catch (error) {
          console.error("Error loading Leaflet:", error)
        }
      }
    }

    loadLeaflet()
  }, [L])

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (L && !mapRef.current) {
      try {
        // Inicializar el mapa centrado en República Dominicana
        const mapInstance = L.map("map").setView([18.7357, -70.1627], 8)

        // Añadir capa de OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstance)

        mapRef.current = mapInstance
        setMap(mapInstance)
      } catch (error) {
        console.error("Error initializing map:", error)
      }
    }
  }, [L])

  // Función para crear iconos personalizados
  const getIcon = useCallback((type: string, leaflet: any) => {
    const colors = {
      hospital: "#3B82F6", // blue
      centro_salud: "#10B981", // green
      clinica: "#8B5CF6", // purple
      movil: "#F59E0B", // orange
    }

    const color = colors[type as keyof typeof colors] || "#6B7280"

    return leaflet.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      className: "custom-div-icon",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
  }, [])

  // Actualizar marcadores cuando cambien los centros
  useEffect(() => {
    if (mapRef.current && L && centros.length > 0) {
      // Limpiar marcadores existentes
      markersRef.current.forEach((marker) => {
        if (mapRef.current && marker) {
          mapRef.current.removeLayer(marker)
        }
      })
      markersRef.current = []

      // Crear nuevos marcadores
      const newMarkers = centros
        .map((centro) => {
          try {
            const marker = L.marker([centro.coordinates.lat, centro.coordinates.lng], {
              icon: getIcon(centro.type, L),
            }).addTo(mapRef.current)

            // Crear popup personalizado
            const popupContent = `
            <div style="min-width: 250px; font-family: system-ui;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                ${centro.name}
              </h3>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; display: flex; align-items: center;">
                <svg width="14" height="14" style="margin-right: 4px;" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                ${centro.address}, ${centro.city}
              </p>
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; font-size: 12px; color: #6b7280;">
                <span style="display: flex; align-items: center;">
                  <svg width="12" height="12" style="margin-right: 4px;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  ${centro.waitTime}
                </span>
                <span style="display: flex; align-items: center;">
                  <svg width="12" height="12" style="margin-right: 4px;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                  ${centro.rating}
                </span>
              </div>
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                ${
                  centro.appointments
                    ? '<button onclick="window.location.href=\'/agendar\'" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">Agendar</button>'
                    : ""
                }
                <button onclick="window.open(\'https://maps.google.com/search/${encodeURIComponent(
                  centro.address + ", " + centro.city,
                )}\', \'_blank\')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">Direcciones</button>
              </div>
            </div>
          `

            marker.bindPopup(popupContent, {
              maxWidth: 300,
              className: "custom-popup",
            })

            // Evento click en marcador
            marker.on("click", () => {
              handleCentroSelect(centro.id)
            })

            return marker
          } catch (error) {
            console.error("Error creating marker:", error)
            return null
          }
        })
        .filter(Boolean)

      markersRef.current = newMarkers

      // Ajustar vista para mostrar todos los marcadores
      if (newMarkers.length > 0) {
        try {
          const group = new L.featureGroup(newMarkers)
          mapRef.current.fitBounds(group.getBounds().pad(0.1))
        } catch (error) {
          console.error("Error fitting bounds:", error)
        }
      }
    }
  }, [centros, L, getIcon, handleCentroSelect])

  // Efecto para resaltar centro seleccionado
  useEffect(() => {
    if (mapRef.current && selectedCentro && markersRef.current.length > 0) {
      const centroIndex = centros.findIndex((centro) => centro.id === selectedCentro)
      const selectedMarker = markersRef.current[centroIndex]

      if (selectedMarker) {
        try {
          selectedMarker.openPopup()
          mapRef.current.setView(selectedMarker.getLatLng(), 12)
        } catch (error) {
          console.error("Error highlighting selected center:", error)
        }
      }
    }
  }, [selectedCentro, centros])

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        markersRef.current.forEach((marker) => {
          if (marker) {
            mapRef.current.removeLayer(marker)
          }
        })
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative">
      <div
        id="map"
        className="w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ zIndex: 1 }}
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
        integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
        crossOrigin=""
      />
      <style jsx>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  )
}
