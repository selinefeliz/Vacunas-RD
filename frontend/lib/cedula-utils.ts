"use client";

import { useState } from "react";

// Utilidad para validar y formatear cédula dominicana
// Formato: XXX-XXXXXXX-X (11 dígitos)

/**
 * Valida el formato de una cédula dominicana
 * @param cedula - Cédula a validar (con o sin guiones)
 * @returns true si es válida, false si no
 */
export function validarCedulaDominicana(cedula: string): boolean {
    // Remover guiones para validar solo números
    const cedulaLimpia = cedula.replace(/-/g, "");

    // Debe tener exactamente 11 dígitos
    if (cedulaLimpia.length !== 11) {
        return false;
    }

    // Debe contener solo números
    if (!/^\d+$/.test(cedulaLimpia)) {
        return false;
    }

    // Validar dígito verificador (último dígito)
    const digitoVerificador = parseInt(cedulaLimpia[10]);
    const calculado = calcularDigitoVerificador(cedulaLimpia.substring(0, 10));

    return digitoVerificador === calculado;
}

/**
 * Calcula el dígito verificador de una cédula dominicana
 * Algoritmo oficial de la JCE
 */
function calcularDigitoVerificador(primeros10Digitos: string): number {
    const pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 10; i++) {
        let producto = parseInt(primeros10Digitos[i]) * pesos[i];

        // Si el producto es mayor a 9, sumar sus dígitos
        if (producto > 9) {
            producto = Math.floor(producto / 10) + (producto % 10);
        }

        suma += producto;
    }

    // El dígito verificador es el complemento a 10
    const modulo = suma % 10;
    return modulo === 0 ? 0 : 10 - modulo;
}

/**
 * Formatea una cédula al formato XXX-XXXXXXX-X
 * @param cedula - Cédula sin formato
 * @returns Cédula formateada
 */
export function formatearCedula(cedula: string): string {
    // Remover todo lo que no sea número
    const cedulaLimpia = cedula.replace(/\D/g, "");

    // Limitar a 11 dígitos
    const cedulaRecortada = cedulaLimpia.substring(0, 11);

    // Aplicar formato XXX-XXXXXXX-X
    if (cedulaRecortada.length <= 3) {
        return cedulaRecortada;
    } else if (cedulaRecortada.length <= 10) {
        return `${cedulaRecortada.substring(0, 3)}-${cedulaRecortada.substring(3)}`;
    } else {
        return `${cedulaRecortada.substring(0, 3)}-${cedulaRecortada.substring(3, 10)}-${cedulaRecortada.substring(10)}`;
    }
}

/**
 * Valida una cédula en la API oficial del Gobierno Dominicano
 * API: https://api.digital.gob.do/v3/citizens/{id}/validate
 * @param cedula - Cédula a validar (con o sin guiones)
 * @returns Resultado de la validación
 */
export async function validarCedulaEnAPI(cedula: string): Promise<ValidationResult> {
    try {
        const cedulaLimpia = cedula.replace(/-/g, "");
        // Construir la URL de forma robusta
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const baseUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/api`;

        console.log(`[FRONTEND] Validando cédula via proxy en: ${baseUrl}/cedula/validate`);

        const response = await fetch(`${baseUrl}/cedula/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cedula: cedulaLimpia }),
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();
        return {
            valid: data.valid,
            message: data.message,
            localValidation: data.localValidation || true,
            apiError: data.apiError || false
        };
    } catch (error: any) {
        console.error("Error en validación:", error);
        // Fallback total en el frontend si el backend falla
        const esValida = validarCedulaDominicana(cedula);
        return {
            valid: esValida,
            message: esValida ? "Cédula válida (validación local)" : "Cédula inválida",
            localValidation: true,
            apiError: true,
        };
    }
}

/**
 * Interfaz para el resultado de validación
 */
export interface ValidationResult {
    valid: boolean;
    message: string;
    localValidation: boolean;
    apiError?: boolean;
}

/**
 * Hook personalizado para manejar la validación de cédula
 */
export function useCedulaValidation() {
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ValidationResult | null>(null);

    const validateCedula = async (cedula: string): Promise<ValidationResult> => {
        setIsValidating(true);
        setError(null);

        try {
            const validationResult = await validarCedulaEnAPI(cedula);
            setResult(validationResult);

            if (!validationResult.valid) {
                setError(validationResult.message);
            }

            return validationResult;
        } catch (err: any) {
            const errorMsg = err.message || "Error al validar cédula";
            setError(errorMsg);

            const fallbackResult: ValidationResult = {
                valid: false,
                message: errorMsg,
                localValidation: false,
                apiError: true,
            };

            setResult(fallbackResult);
            return fallbackResult;
        } finally {
            setIsValidating(false);
        }
    };

    const reset = () => {
        setError(null);
        setResult(null);
    };

    return { validateCedula, isValidating, error, result, reset };
}
