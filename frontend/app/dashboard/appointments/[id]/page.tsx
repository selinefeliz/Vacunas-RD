"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import useApi from "@/hooks/use-api";
import AppointmentCard, { Appointment } from "@/components/appointments/appointment-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { request: callApi, loading } = useApi<Appointment[]>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    (async () => {
      try {
        const data = await callApi("/api/appointments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const found = Array.isArray(data)
          ? data.find((a) => a.id_Cita.toString() === id)
          : null;
        if (!found) {
          router.replace("/dashboard");
        } else {
          setAppointment(found);
        }
      } catch (e) {
        console.error(e);
        router.replace("/dashboard");
      }
    })();
  }, [token, id, callApi, router]);

  if (loading || !appointment) {
    return (
      <div className="flex h-60 items-center justify-center">
        <p className="text-muted-foreground">Cargando cita...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detalles de la Cita</h1>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
      <AppointmentCard appointment={appointment} />
    </div>
  );
}
