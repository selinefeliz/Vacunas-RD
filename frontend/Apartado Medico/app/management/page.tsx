"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ManagementPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/management/availability")
  }, [router])

  return <div>Redirigiendo a la gestión de disponibilidad...</div>
}
