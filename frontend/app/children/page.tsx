"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useApi from '@/hooks/use-api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Plus, MessageCircle, Bell } from 'lucide-react';
import ChildCardEnhanced, { EnhancedChild } from '@/components/children/child-card-enhanced';
import LinkRequestsManager from '@/components/children/link-requests-manager';




export default function ChildrenListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: children, loading, error, request: fetchChildren } = useApi<EnhancedChild[]>();
  const [showRequests, setShowRequests] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | undefined>();

  useEffect(() => {
    if (user?.id) {
      // Use the new detailed endpoint
      fetchChildren(`/api/ninos/tutor/${user.id}/detailed`);
    }
  }, [fetchChildren, user]);

  const handleViewProfile = (childId: number) => {
    router.push(`/children/${childId}/profile`);
  };

  const handleViewRequests = (childId?: number) => {
    setSelectedChildId(childId);
    setShowRequests(true);
  };

  const getTotalPendingRequests = () => {
    if (!children) return 0;
    return children.reduce((total, child) => total + (child.SolicitudesPendientes || 0), 0);
  };

  return (
    <div className="container mx-auto py-8 px-4">








      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Niños</h1>
          <p className="text-gray-600 mt-1">
            Gestiona la información y solicitudes de vinculación de tus niños
          </p>
        </div>
        <div className="flex gap-2">
          {getTotalPendingRequests() > 0 && (
            <Button
              variant="outline"
              onClick={() => handleViewRequests()}
              className="relative"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Solicitudes
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getTotalPendingRequests()}
              </span>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/children/link">
              <MessageCircle className="h-4 w-4 mr-2" />
              Solicitar Vinculación
            </Link>
          </Button>
          <Button asChild>
            <Link href="/children/new">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Nuevo Niño
            </Link>
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-lg">Cargando información de niños...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudieron cargar los niños. Por favor, inténtalo de nuevo más tarde.
            <br />
            <small className="text-xs opacity-70">Detalles: {error}</small>
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && children && (
        <>
          {children.length > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <span className="text-2xl">👶</span>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Niños</p>
                      <p className="text-2xl font-bold text-blue-700">{children.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-100 p-2 rounded-full">
                      <span className="text-2xl">💉</span>
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Con Vacunas</p>
                      <p className="text-2xl font-bold text-green-700">
                        {children.filter(child => child.UltimaVacuna !== 'Sin vacunas').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <Bell className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Solicitudes Pendientes</p>
                      <p className="text-2xl font-bold text-amber-700">{getTotalPendingRequests()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Children Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {children.map((child) => (
                  <ChildCardEnhanced
                    key={child.id_Nino}
                    child={child}
                    onViewProfile={handleViewProfile}
                    onViewRequests={child.SolicitudesPendientes > 0 ? () => handleViewRequests(child.id_Nino) : undefined}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">👶</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">No Tienes Niños Registrados</h2>
              <p className="text-gray-500 mb-6">
                Comienza registrando a tu primer niño o solicita vincularte a uno existente.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/children/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Nuevo Niño
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/children/link">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Solicitar Vinculación
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Link Requests Manager Modal */}
      <LinkRequestsManager
        isOpen={showRequests}
        onClose={() => {
          setShowRequests(false);
          setSelectedChildId(undefined);
          // Refresh children data after handling requests
          if (user?.id) {
            fetchChildren(`/api/ninos/tutor/${user.id}/detailed`);
          }
        }}
        childId={selectedChildId}
      />






    </div>
  );
}
