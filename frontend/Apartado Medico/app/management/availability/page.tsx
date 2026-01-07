"use client"

import { useState } from "react"
import { AppointmentsManagementEnhanced } from "@/components/availability/appointments-management-table"

const AvailabilityManagementPage = () => {
  const [refreshData, setRefreshData] = useState(false)

  const handleFormSubmit = () => {
    setRefreshData((prev) => !prev)
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-5">Availability Management</h1>
      <AppointmentsManagementEnhanced onDataRefresh={handleFormSubmit} />
    </div>
  )
}

export default AvailabilityManagementPage
