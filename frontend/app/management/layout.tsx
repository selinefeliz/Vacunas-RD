'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ManagementLayoutProps {
    children: ReactNode;
}

export default function ManagementLayout({ children }: ManagementLayoutProps) {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!isAuthenticated || !user || ![1, 2, 3, 6].includes(user.id_Rol))) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, user, loading, router]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated || !user || ![1, 2, 3, 6].includes(user.id_Rol)) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    );
}
