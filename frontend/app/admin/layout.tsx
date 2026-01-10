'use client'

import { useAuth } from '@/context/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// --- Components ---

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    <p className="ml-4 text-lg">Cargando y Verificando Acceso...</p>
  </div>
);

function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/users', label: 'Usuarios' },
    { href: '/admin/centers', label: 'Centros de Vacunación' },
    { href: '/admin/audit-log', label: 'Historial de Auditoría' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-100 p-4 dark:bg-gray-800">
      <nav className="flex h-full flex-col">
        <div className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
        <Button onClick={handleLogout} variant="destructive">
          Cerrar Sesión
        </Button>
      </nav>
    </aside>
  );
}

// --- Main Layout Component ---

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // This effect runs on every render, satisfying the Rules of Hooks.
    if (loading) return; // Wait until loading is complete

    if (!isLoginPage && (!user || user.role?.trim().toLowerCase() !== 'administrador')) {
      router.push('/admin/login');
    }
  }, [loading, user, router, isLoginPage, pathname]);

  // --- Render Logic ---

  // If on the login page, render it directly without the sidebar.
  if (isLoginPage) {
    return <>{children}</>;
  }

  // While loading, show a full-page spinner.
  if (loading) {
    return <LoadingSpinner />;
  }

  // If not loading, but user is not an authorized admin, show spinner while redirecting.
  if (!user || user.role?.trim().toLowerCase() !== 'administrador') {
    return <LoadingSpinner />;
  }

  // If all checks pass, render the protected admin layout with the sidebar.
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
