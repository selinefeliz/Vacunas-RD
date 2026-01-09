"use client";
import { Calendar, Clock, UserCheck, Stethoscope, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { combineDateTime, formatDisplayDate, formatTimeString, formatDateString } from "@/utils/format-time";
import { useAuth } from "@/context/auth-context";

export interface Appointment {
  id_Cita: number;
  NombrePaciente: string;
  Fecha: string;
  Hora: string;
  NombreVacuna: string;
  NombreCentro: string;
  EstadoCita: string;
  id_EstadoCita?: number;
  RequiereTutor: boolean;
  NombreCompletoPersonalAplicado: string | null;
  id_PersonalSalud: number | null;
  NombrePersonalSalud: string | null;
}

type Variant = "list" | "detail";
interface Props {
  appointment: Appointment;
  className?: string;
  variant?: Variant;
}

export default function AppointmentCard({ appointment, className, variant = "list" }: Props) {
  const { user } = useAuth();

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-6",
        variant === "detail" ? "space-y-4" : "flex items-center justify-between p-4",
        className
      )}
    >
      <div className="space-y-1 flex-1">
        {/* Title & badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-slate-900 text-lg">{appointment.NombreVacuna}</p>
          {variant === "list" && appointment.RequiereTutor && (
            <span className="text-xs bg-blue-100 text-blue-900 px-2 py-1 rounded-full flex items-center gap-1 font-bold border border-blue-200">
              👶 <span className="text-blue-900">Niño</span>
            </span>
          )}
          {variant === "list" && appointment.EstadoCita === "Confirmada" && (
            <span className="text-xs bg-green-100 text-green-900 px-2 py-1 rounded-full flex items-center gap-1 font-bold border border-green-200">
              <UserCheck className="h-3 w-3 text-green-900" /> <span className="text-green-900">Confirmada</span>
            </span>
          )}
        </div>

        {/* Fecha / hora / centro */}
        <div className="flex items-center text-sm font-bold text-slate-800 gap-4 flex-wrap mt-2">
          <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-900">
            <Calendar className="h-4 w-4 text-primary fill-none" />
            <span className="text-slate-900">{formatDateString(appointment.Fecha)}</span>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-900">
            <Clock className="h-4 w-4 text-primary fill-none" />
            <span className="text-slate-900">{formatTimeString(appointment.Hora)}</span>
          </span>
        </div>
        <p className="text-sm font-bold text-slate-900 italic mt-3">
          Centro: <span className="text-slate-700 not-italic font-semibold">{appointment.NombreCentro}</span>
        </p>
        <div className="text-sm font-extrabold text-primary mt-2 bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Paciente</p>
          <p className="text-slate-900 underline underline-offset-4 text-base">{appointment.NombrePaciente}</p>
        </div>

        {/* Médico asignado / pendiente */}
        {(appointment.NombreCompletoPersonalAplicado || appointment.NombrePersonalSalud) && (
          <div className="flex items-center text-sm text-green-900 bg-green-50 border border-green-100 px-3 py-1.5 rounded-md mt-3 w-max">
            <Stethoscope className="mr-1.5 h-4 w-4 text-green-700" />
            <span className="font-bold text-green-900">Dr(a). {appointment.NombreCompletoPersonalAplicado || appointment.NombrePersonalSalud}</span>
          </div>
        )}
        {appointment.EstadoCita === "Confirmada" && !(appointment.NombreCompletoPersonalAplicado || appointment.NombrePersonalSalud) && (
          <div className="flex items-center text-sm text-amber-900 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-md mt-3 w-max">
            <AlertCircle className="mr-1.5 h-4 w-4 text-amber-700" />
            <span className="font-bold text-amber-900">Confirmada - Médico por asignar</span>
          </div>
        )}
      </div>

      {variant === "list" && (
        <div className="flex items-center gap-2 ml-4">
          <span
            className={cn(
              "rounded-full px-2 py-1 text-xs font-medium",
              appointment.EstadoCita === "Confirmada"
                ? "bg-green-100 text-green-800"
                : appointment.EstadoCita === "Agendada"
                  ? "bg-yellow-100 text-yellow-800"
                  : appointment.EstadoCita.includes("Cancelada")
                    ? "bg-red-100 text-red-800"
                    : "bg-primary/10 text-primary"
            )}
          >
            {appointment.EstadoCita}
          </span>
          <Link
            href={`/dashboard/appointments/${appointment.id_Cita}`}
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Ver Detalles
          </Link>
        </div>
      )}
      {variant === "detail" && (
        <div className="flex justify-end gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              appointment.EstadoCita === "Confirmada"
                ? "bg-green-100 text-green-800"
                : appointment.EstadoCita === "Agendada"
                  ? "bg-yellow-100 text-yellow-800"
                  : appointment.EstadoCita.includes("Cancelada")
                    ? "bg-red-100 text-red-800"
                    : "bg-primary/10 text-primary"
            )}
          >
            {appointment.EstadoCita}
          </span>
        </div>
      )}
    </div>
  );
}
