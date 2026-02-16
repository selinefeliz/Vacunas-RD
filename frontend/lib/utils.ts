import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatearTelefono(valor: string): string {
  // Solo números
  const soloNumeros = valor.replace(/\D/g, "").slice(0, 10);

  if (soloNumeros.length <= 3) return soloNumeros;
  if (soloNumeros.length <= 6) {
    return `(${soloNumeros.slice(0, 3)}) ${soloNumeros.slice(3)}`;
  }
  return `(${soloNumeros.slice(0, 3)}) ${soloNumeros.slice(3, 6)}-${soloNumeros.slice(6)}`;
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
}
