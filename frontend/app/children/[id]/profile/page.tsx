'use client';

import { useEffect } from 'react';
import { formatTimeString } from '@/utils/format-time';
import { useParams, useRouter } from 'next/navigation';
import useApi from '@/hooks/use-api';
import { Loader2, User, ShieldCheck, ShieldAlert, Shield, ArrowRight, ArrowLeft, AlertCircle, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, differenceInMonths, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Interfaces
interface ChildProfile {
    id_Nino: number;
    Nombres: string;
    Apellidos: string;
    FechaNacimiento: string;
    Genero: string;
}

interface VaccinationScheduleEntry {
    id_Vacuna: number;
    NombreVacuna: string;
    DosisPorAplicar: number;
    FechaSugerida: string;
    Estado: 'Vencida' | 'Proxima' | 'Pendiente' | 'Edad Excedida' | 'Futura';
    Criterio: string;
}

// Helper to get badge color based on status
const getStatusBadgeVariant = (status: VaccinationScheduleEntry['Estado']) => {
    switch (status) {
        case 'Vencida':
            return 'destructive';
        case 'Proxima':
            return 'secondary';
        case 'Futura':
            return 'outline'; // or a custom calm blue if available, outline is fine for now
        default:
            return 'outline';
    }
};

interface Appointment {
    id_Cita: number;
    id_Vacuna: number;
    Fecha: string;
    Hora: string;
    EstadoCita: string;
}

// Helper to get icon based on status
const getStatusIcon = (status: VaccinationScheduleEntry['Estado']) => {
    switch (status) {
        case 'Vencida':
            return <ShieldAlert className="h-5 w-5 text-red-500" />;
        case 'Proxima':
            return <AlertCircle className="h-5 w-5 text-yellow-500" />;
        case 'Futura':
            return <Calendar className="h-5 w-5 text-gray-400" />;
        default:
            return <Shield className="h-5 w-5 text-gray-400" />;
    }
};

// Helper to format age
const formatAge = (birthDate: string) => {
    const dob = new Date(birthDate);
    const today = new Date();
    const months = differenceInMonths(today, dob);
    const years = differenceInYears(today, dob);

    if (years === 0) {
        return `${months} Meses`;
    }
    return `${years} Años`;
};

export default function ChildProfilePage() {
    const params = useParams();
    const router = useRouter();
    const childId = params.id as string;

    const { data: childProfile, loading: loadingProfile, error: errorProfile, request: fetchProfile } = useApi<ChildProfile>();
    const { data: schedule, loading: loadingSchedule, error: errorSchedule, request: fetchSchedule } = useApi<VaccinationScheduleEntry[]>();
    const { data: appointments, request: fetchAppointments } = useApi<Appointment[]>();

    useEffect(() => {
        if (childId) {
            fetchProfile(`/api/ninos/${childId}`);
            fetchSchedule(`/api/ninos/${childId}/vaccination-schedule`);
            fetchAppointments(`/api/ninos/${childId}/appointments`);
        }
    }, [childId, fetchProfile, fetchSchedule, fetchAppointments]);

    if (loadingProfile || loadingSchedule) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-xl font-medium">Cargando perfil del niño...</p>
            </div>
        );
    }

    if (errorProfile || !childProfile) {
        return (
            <div className="container mx-auto py-12 px-4 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Perfil no encontrado</h2>
                <p className="text-muted-foreground mb-6">No se pudo cargar la información del niño especificado.</p>
                <Button onClick={() => router.back()}>Volver al Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            {/* Header & Back Button */}
            <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </Button>
                <Badge variant="outline" className="px-3 py-1">ID: #{childProfile.id_Nino}</Badge>
            </div>

            {/* Child Info Card */}
            <Card className="mb-8 overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <div className="h-2 bg-primary w-full" />
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="bg-primary/10 p-4 rounded-2xl">
                            <User className="h-16 w-16 text-primary" />
                        </div>
                        <div className="text-center md:text-left space-y-1">
                            <CardTitle className="text-4xl font-extrabold tracking-tight">
                                {childProfile.Nombres} {childProfile.Apellidos}
                            </CardTitle>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center text-muted-foreground mt-2">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(childProfile.FechaNacimiento), 'dd MMMM yyyy', { locale: es })}
                                </span>
                                <span className="h-1 w-1 bg-gray-400 rounded-full" />
                                <span className="flex items-center gap-1 font-medium capitalize">
                                    {childProfile.Genero === 'M' ? 'Niño' : childProfile.Genero === 'F' ? 'Niña' : 'Otro'}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Edad Actual</p>
                            <p className="text-xl font-bold">{childProfile ? formatAge(childProfile.FechaNacimiento) : '--'}</p>
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Identificación</p>
                            <p className="text-xl font-bold">{(childProfile as any).CodigoIdentificacion || '---'}</p>
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Estado General</p>
                            <Badge className={cn("mt-1", schedule && schedule.some(s => s.Estado === 'Vencida') ? "bg-red-100 text-red-800 border-red-200" : "bg-green-100 text-green-800 border-green-200")}>
                                {schedule && schedule.some(s => s.Estado === 'Vencida') ? 'Esquema Atrasado' : 'Al día'}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Vaccination Schedule Card */}
            <Card className="border-none shadow-lg">
                <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">Esquema de Vacunación</CardTitle>
                            <CardDescription>Seguimiento de dosis según el Programa Ampliado de Inmunización (PAI).</CardDescription>
                        </div>
                        <ShieldCheck className="h-8 w-8 text-primary opacity-20" />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {errorSchedule ? (
                        <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg border border-red-100">
                            <ShieldAlert className="h-10 w-10 mx-auto mb-2" />
                            <p className="font-bold">Error al cargar datos</p>
                            <p className="text-sm">No pudimos conectar con el servidor de esquemas.</p>
                        </div>
                    ) : schedule && schedule.length > 0 ? (
                        <div className="space-y-8">
                            {/* Urgent Alert for Overdue */}
                            {schedule[0].Estado === 'Vencida' && (
                                <Alert variant="destructive" className="bg-red-50 border-red-200 animate-pulse">
                                    <ShieldAlert className="h-5 w-5" />
                                    <AlertTitle className="font-bold">¡Dosis Vencidas Detectadas!</AlertTitle>
                                    <AlertDescription>
                                        Hay vacunas que ya deberían haberse aplicado. Se recomienda priorizar <strong>{schedule[0].NombreVacuna}</strong>.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Schedule List */}
                            <div className="relative">
                                {/* Vertical Line Timeline */}
                                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800 hidden md:block" />

                                <div className="space-y-4">
                                    {/* Compute Blocked Status Logic */
                                        (() => {
                                            // 1. Identify Minimum Unfinished Age Group
                                            // We consider a group "Unfinished" if it has any item with Status: Vencida, Pendiente, or Proxima.
                                            // We exclude 'Futura' (too far) and 'Completada' (done).
                                            // actually 'Completada' is filtered out of 'schedule' usually, so we just look at what's here.
                                            // Wait, if I have a 2-month vaccine that is 'Futura' (e.g. I am 1 month old), 
                                            // does it block 4-month vaccines? 
                                            // Yes, 2-month must be done before 4-month.
                                            // But 'Futura' means I can't do it yet?
                                            // If I am 1 month old, 2-month is Futura, 4-month is Futura.
                                            // Both are Futura. Neither is "Pendiente".
                                            // So minUnfinishedAge might be empty?
                                            // If everything is Futura, we shouldn't block purely based on "Pendiente".
                                            // We should block based on Age Order.

                                            // Simplified Rule: "Complete el grupo anterior".
                                            // Block items where EdadMinimaMeses > (Lowest Age of any non-completed item).
                                            // Even if that lowest item is Futura?
                                            // If I am 1 mo. 2mo(Futura), 4mo(Futura).
                                            // Can I schedule 4mo? No, must do 2mo first.
                                            // So yes, Lowest Age of ANY item in the schedule defines current focus.

                                            // Filter out 'Edad Excedida' (they shouldn't block valid ones? or should they?)
                                            // If I missed my 2mo vaccine and I am 5 years old (Exceeded), should I be blocked from 4mo?
                                            // Probably not if it's abandoned. But let's assume 'Edad Excedida' items are effectively "done/skipped".
                                            // We should filtered them out of the blocker logic ideally.
                                            // For now, let's include all non-skipped items.

                                            const activeItems = schedule.filter(s => s.Estado !== 'Edad Excedida');
                                            const minOpenAge = activeItems.length > 0
                                                ? Math.min(...activeItems.map(s => (s as any).EdadMinimaMeses || 0))
                                                : 999;

                                            return schedule.filter(s => s.Estado !== 'Edad Excedida').map((item, idx) => {
                                                // Determine if Blocked
                                                const itemAge = (item as any).EdadMinimaMeses || 0;
                                                const isBlocked = itemAge > minOpenAge;

                                                // Smart Matching Logic (Per Item)
                                                // We need to know which appointment index corresponds to THIS dose.
                                                // Strategy: Get all for this vaccine name, sort them. Get all doses for this vaccine name, sort them. Match index.
                                                const getMatchedAppointment = () => {
                                                    const activeAppointments = appointments?.filter(a =>
                                                        (a as any).NombreVacuna === item.NombreVacuna &&
                                                        ['Agendada', 'Confirmada'].includes(a.EstadoCita)
                                                    ).sort((a, b) => new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime()) || [];

                                                    const dosesOfThisVaccine = schedule
                                                        .filter(s => s.NombreVacuna === item.NombreVacuna && s.Estado !== 'Edad Excedida') // Consider all visible doses
                                                        .sort((a, b) => a.DosisPorAplicar - b.DosisPorAplicar);

                                                    const myIndex = dosesOfThisVaccine.findIndex(d => d.DosisPorAplicar === item.DosisPorAplicar);

                                                    if (myIndex !== -1 && activeAppointments[myIndex]) {
                                                        const matchedAppt = activeAppointments[myIndex];
                                                        if (new Date(matchedAppt.Fecha).getFullYear() > 2000) return matchedAppt;
                                                    }
                                                    return null;
                                                };

                                                const matchedAppt = getMatchedAppointment();

                                                return (
                                                    <div
                                                        key={`${item.id_Vacuna}-${item.DosisPorAplicar}`}
                                                        className={cn(
                                                            "relative flex flex-col md:flex-row items-center md:items-start md:justify-between p-5 border rounded-2xl transition-all duration-200",
                                                            item.Estado === 'Vencida' ? "bg-red-50/30 border-red-100 hover:border-red-200" : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:shadow-md",
                                                            isBlocked && "opacity-75 grayscale-[0.5]"
                                                        )}
                                                    >
                                                        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 flex-1">
                                                            <div className={cn(
                                                                "z-10 p-3 rounded-full md:mt-1",
                                                                item.Estado === 'Vencida' ? "bg-red-100 text-red-600" :
                                                                    item.Estado === 'Proxima' ? "bg-amber-100 text-amber-600" :
                                                                        item.Estado === 'Futura' ? "bg-gray-50 text-gray-400" : "bg-blue-50 text-blue-500"
                                                            )}>
                                                                {getStatusIcon(item.Estado)}
                                                            </div>
                                                            <div className="text-center md:text-left">
                                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                                    {item.NombreVacuna}
                                                                    <span className="ml-2 text-sm font-normal text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                                                        Dosis {item.DosisPorAplicar}
                                                                    </span>
                                                                </h3>
                                                                <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 mt-2">
                                                                    <p className="text-sm font-medium flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        Sugerido: <span className="text-gray-900 dark:text-gray-100">{format(new Date(item.FechaSugerida), 'dd/MM/yyyy')}</span>
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        <Shield className="h-3 w-3" />
                                                                        {item.Criterio} ({itemAge} meses)
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end gap-3 min-w-[140px]">
                                                            {matchedAppt ? (
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                        <Clock className="w-3 h-3 mr-1" />
                                                                        Cita Agendada
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {format(new Date(matchedAppt.Fecha), 'dd/MM/yyyy', { locale: es })}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {formatTimeString(matchedAppt.Hora)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <Badge variant={getStatusBadgeVariant(item.Estado)} className="w-full justify-center py-1">
                                                                        {item.Estado}
                                                                    </Badge>
                                                                    {isBlocked ? (
                                                                        <span className="text-xs text-center text-muted-foreground block w-full mt-2">
                                                                            Complete el grupo de {minOpenAge} meses
                                                                        </span>
                                                                    ) : (
                                                                        <Button asChild size="sm" className="w-full mt-2">
                                                                            <Link href={`/appointments/new?childId=${childId}&vaccineId=${item.id_Vacuna}`}>
                                                                                Agendar <ArrowRight className="ml-2 h-4 w-4" />
                                                                            </Link>
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    {/* End Logic */}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="bg-green-50 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="h-12 w-12 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-green-700 mb-2">¡Misión Cumplida!</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                El esquema de vacunación de <strong>{childProfile.Nombres}</strong> está completo según los estándares nacionales.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
