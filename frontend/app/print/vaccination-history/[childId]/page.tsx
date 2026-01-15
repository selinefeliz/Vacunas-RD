"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import useApi from "@/hooks/use-api"
import { useAuth } from "@/context/auth-context"
import { formatDateString, formatTimeString } from "@/utils/format-time"
import { Syringe, User, Calendar, MapPin, ShieldCheck } from "lucide-react"

export default function PrintHistoryPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const childId = params.childId
    const { request: fetchHistory, loading } = useApi()
    const { token } = useAuth()

    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (childId && token) {
            loadData()
        }
    }, [childId, token])

    const loadData = async () => {
        try {
            const response = await fetchHistory("/api/medical/patient-full-history", {
                method: "POST",
                body: {
                    id_Nino: parseInt(childId as string),
                    id_Usuario: null
                }
            })
            if (response) {
                setData(response)
                // Auto print after a short delay for styles to load
                setTimeout(() => {
                    window.print()
                }, 1500)
            }
        } catch (err: any) {
            setError(err.message)
        }
    }

    if (loading) return <div className="p-10 text-center">Cargando certificado oficial...</div>
    if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>
    if (!data) return null

    const { medicalHistory, vaccinationHistory } = data

    return (
        <div className="bg-white min-h-screen p-8 text-black print:p-0">
            {/* Header / Watermark style */}
            <div className="max-w-4xl mx-auto border-4 border-blue-900 p-8 relative overflow-hidden bg-white shadow-xl print:shadow-none print:border-2">

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-900 text-white flex items-center justify-center -mr-16 -mt-16 rotate-45">
                    <span className="text-xs font-bold -rotate-45 mt-10">OFICIAL</span>
                </div>

                {/* Content */}
                <div className="flex justify-between items-start mb-10 border-b-2 border-blue-100 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-900 p-3 rounded-xl shadow-lg">
                            <ShieldCheck className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-blue-900 tracking-tight">CERTIFICADO NACIONAL</h1>
                            <p className="text-blue-600 font-bold tracking-widest text-sm italic">SISTEMA NACIONAL DE VACUNACIÓN</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 font-mono">CC-V1-{Date.now().toString(36).toUpperCase()}</p>
                        <p className="text-sm font-bold text-gray-700">{new Date().toLocaleDateString('es-DO')}</p>
                    </div>
                </div>

                {/* Patient Info Card */}
                <div className="bg-blue-50 rounded-2xl p-6 mb-8 border border-blue-100 grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-blue-800 uppercase tracking-widest opacity-70">Nombre del Paciente</label>
                            <p className="text-xl font-bold text-gray-900">{medicalHistory.NombrePaciente}</p>
                        </div>
                        <div className="flex gap-8">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-blue-800 uppercase tracking-widest opacity-70">Fecha de Nacimiento</label>
                                <p className="font-semibold text-gray-800">{formatDateString(medicalHistory.FechaNacimiento)}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-blue-800 uppercase tracking-widest opacity-70">Edad</label>
                                <p className="font-semibold text-gray-800">{medicalHistory.EdadActual} años</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 border-l border-blue-200 pl-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-red-800 uppercase tracking-widest opacity-70">Alergias</label>
                            <p className="text-sm font-bold text-red-600">{medicalHistory.Alergias || "NINGUNA REGISTRADA"}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-blue-800 uppercase tracking-widest opacity-70">ID de Registro</label>
                            <p className="font-mono text-xs font-bold text-gray-600">NV-{medicalHistory.id_Historico}-{childId}</p>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <Syringe className="w-5 h-5" />
                    REGISTRO DE INMUNIZACIÓN
                </h3>

                {/* Table */}
                <div className="mb-10 overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-900 text-white">
                                <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider border-none">Vacuna / Antígeno</th>
                                <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider border-none text-center">Dosis</th>
                                <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider border-none">Fecha de Aplicación</th>
                                <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider border-none">Centro de Salud</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {vaccinationHistory.map((record: any, idx: number) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-gray-800">{record.Vacuna}</p>
                                        <p className="text-[10px] text-gray-500 font-mono italic">Lote: {record.NumeroLote || 'N/A'}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-black ring-1 ring-blue-300">
                                            {record.NumeroDosis} / {record.DosisLimite}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-700">{formatDateString(record.FechaAplicacion)}</p>
                                        <p className="text-[10px] text-gray-400">{formatTimeString(record.HoraAplicacion)}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-blue-400" />
                                            <span className="text-gray-600 text-xs font-medium uppercase">{record.CentroMedico}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {vaccinationHistory.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-gray-400 italic">No se han registrado aplicaciones oficialmente.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Authority */}
                <div className="grid grid-cols-2 gap-12 mt-16 pt-10 border-t-2 border-gray-100">
                    <div className="text-center space-y-4">
                        <div className="h-20 w-48 mx-auto border-b-2 border-gray-300 flex items-end justify-center">
                            <span className="font-['Dancing_Script'] text-2xl text-blue-900 opacity-80 mb-2">Sello Digital</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">VALIDACIÓN QR / CÓDIGO BARRAS</p>
                            <div className="h-6 w-32 bg-gray-200 mt-2 mx-auto rounded-sm opacity-50 flex items-center justify-center">
                                <div className="w-full flex gap-1 px-2 h-4">
                                    {[...Array(12)].map((_, i) => <div key={i} className={`h-full bg-gray-500 rounded-full ${i % 3 === 0 ? 'w-1' : 'w-0.5'}`} />)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[9px] leading-relaxed text-gray-500 italic">
                                Este certificado es un documento oficial emitido por el Ministerio de Salud Pública de la República Dominicana.
                                La información aquí contenida está validada en la base de datos nacional y tiene plena validez para fines escolares, migratorios y laborales.
                            </p>
                        </div>
                        <div className="flex justify-end items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-blue-900 opacity-50 uppercase tracking-tighter">Powered by</p>
                                <p className="text-sm font-black text-blue-800">Vacunas RD</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print button for non-print view */}
            <div className="mt-8 text-center print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-blue-900 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:bg-blue-800 transition-all flex items-center gap-2 mx-auto"
                >
                    <Syringe className="w-5 h-5" />
                    IMPRIMIR AHORA
                </button>
                <p className="text-gray-400 text-xs mt-4">Si no se abre el diálogo de impresión automáticamente, haga clic en el botón superior.</p>
            </div>

            <style jsx global>{`
        @media print {
          title { display: none; }
          body { background: white !important; }
          .print-hidden { display: none !important; }
          @page {
            margin: 0.5cm;
            size: letter;
          }
        }
      `}</style>
        </div>
    )
}
