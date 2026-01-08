"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  id_Rol: number;
  id_CentroVacunacion?: number;
  NombreCentro?: string; // Added to support auto-context setting
}

interface MedicalCenter {
  id_CentroVacunacion: number;
  Nombre: string;
  EsPrincipal: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  selectedCenter: MedicalCenter | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setSelectedCenter: (center: MedicalCenter | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedCenter, setSelectedCenterState] = useState<MedicalCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedCenter = localStorage.getItem('selectedCenter');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedCenter) {
          setSelectedCenterState(JSON.parse(storedCenter));
        }
      } else {
        setToken(null);
        setUser(null);
        setSelectedCenterState(null);
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    console.log('[AuthContext] User object received in login:', JSON.stringify(newUser, null, 2));

    // Force center selection logic
    if (newUser.id_Rol === 2) { // Doctor -> Must select center from list (often has multiple)
      localStorage.removeItem('selectedCenter');
      setSelectedCenterState(null);
      router.push('/admin/inventory');
    }
    else if (newUser.id_Rol === 3) { // Nurse -> Skip selection screen, auto-set center
      if (newUser.id_CentroVacunacion && newUser.NombreCentro) {
        console.log('[AuthContext] Auto-setting center for Nurse:', newUser.NombreCentro);
        const autoCenter: MedicalCenter = {
          id_CentroVacunacion: newUser.id_CentroVacunacion,
          Nombre: newUser.NombreCentro,
          EsPrincipal: true
        };
        localStorage.setItem('selectedCenter', JSON.stringify(autoCenter));
        setSelectedCenterState(autoCenter);
        router.push('/management/medical/appointments');
      } else {
        // Fallback if data is missing (should verify why)
        console.warn('[AuthContext] Nurse missing center info, falling back to selection.');
        router.push('/management/medical/select-center');
      }
    }
    else if (newUser.id_Rol === 1) { // Admin
      router.push('/admin');
    } else if (newUser.id_Rol === 5) { // Tutor
      router.push('/dashboard');
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  const logout = useCallback(() => {
    // Clear all session data from state and local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedCenter');
    setToken(null);
    setUser(null);
    setSelectedCenterState(null);
    router.push('/login');
  }, [router]);

  const handleSetSelectedCenter = useCallback((center: MedicalCenter | null) => {
    if (center) {
      localStorage.setItem('selectedCenter', JSON.stringify(center));
    } else {
      localStorage.removeItem('selectedCenter');
    }
    setSelectedCenterState(center);
  }, []);

  const value = useMemo(() => ({
    isAuthenticated: !!token,
    token,
    user,
    selectedCenter,
    login,
    logout,
    setSelectedCenter: handleSetSelectedCenter,
    loading,
  }), [token, user, selectedCenter, loading, login, logout, handleSetSelectedCenter]);

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
