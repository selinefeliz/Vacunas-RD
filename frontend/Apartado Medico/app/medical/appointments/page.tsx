"use client"

import { MedicalAppointmentsView } from "@/components/medical/medical-appointments-view"

export default function MedicalAppointmentsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Atención Médica</h1>
        <p className="text-gray-600 mt-2">Gestión de citas médicas y aplicación de vacunas</p>
      </div>
      <MedicalAppointmentsView />
    </div>
  )
}
